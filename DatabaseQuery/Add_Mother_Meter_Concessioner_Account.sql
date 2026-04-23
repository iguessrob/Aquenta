-- ============================================================================
-- FILE: Add_Mother_Meter_Concessioner_Account.sql
-- PURPOSE:
--   Create a dedicated concessioner account for the Mother Meter so you can:
--   1) track monthly mother meter water consumption
--   2) use its readings for future water-loss calculations
--
-- SAFE TO RE-RUN:
--   This script is idempotent. It will not create duplicate User/Concessioner
--   records when executed multiple times.
-- ============================================================================

USE AquentaDB;
GO

BEGIN TRY
    BEGIN TRAN;

    -- ------------------------------------------------------------------------
    -- 1) EDITABLE INPUTS (change these values if needed)
    -- ------------------------------------------------------------------------
    DECLARE @Username        VARCHAR(50)  = 'mother_meter_01';
    DECLARE @Pass            VARCHAR(255) = 'MotherMeter@123';
    DECLARE @FirstName       VARCHAR(50)  = 'Mother';
    DECLARE @LastName        VARCHAR(50)  = 'Meter';
    DECLARE @UserRole        VARCHAR(50)  = 'Concessioner';

    DECLARE @CategoryName    NVARCHAR(20) = N'Commercial';
    DECLARE @MembershipName  NVARCHAR(20) = N'Full Subsidy';
    DECLARE @DistrictName    NVARCHAR(50) = N'Purok 1';

    DECLARE @AccountNumber   NVARCHAR(20) = N'ACC-MOTHER-0001';
    DECLARE @MeterNumber     NVARCHAR(30) = N'MTR-MOTHER-0001';
    DECLARE @Address         NVARCHAR(255)= N'Mainline Source / Mother Meter';
    DECLARE @ContactNumber   NVARCHAR(15) = N'09000000000';
    DECLARE @EmailAddress    NVARCHAR(50) = N'mothermeter@aquenta.local';
    DECLARE @Status          NVARCHAR(20) = N'Active';

    -- ------------------------------------------------------------------------
    -- 2) RESOLVE FOREIGN KEYS
    -- ------------------------------------------------------------------------
    DECLARE @CategoryID INT;
    DECLARE @MembershipID INT;
    DECLARE @DistrictID INT;

    SELECT @CategoryID = CategoryID
    FROM dbo.tbl_Category
    WHERE CategoryName = @CategoryName;

    SELECT @MembershipID = MembershipID
    FROM dbo.tbl_Membership
    WHERE MembershipName = @MembershipName;

    SELECT @DistrictID = DistrictID
    FROM dbo.tbl_District
    WHERE DistrictName = @DistrictName;

    IF @CategoryID IS NULL
        THROW 50001, 'Category not found. Check @CategoryName value.', 1;

    IF @MembershipID IS NULL
        THROW 50002, 'Membership not found. Check @MembershipName value.', 1;

    IF @DistrictID IS NULL
        THROW 50003, 'District not found. Check @DistrictName value.', 1;

    -- ------------------------------------------------------------------------
    -- 3) CREATE OR REUSE USER
    -- ------------------------------------------------------------------------
    DECLARE @UserID INT;

    SELECT @UserID = UserID
    FROM dbo.tbl_User
    WHERE Username = @Username;

    IF @UserID IS NULL
    BEGIN
        INSERT INTO dbo.tbl_User (Username, Pass, FirstName, LastName, UserRole)
        VALUES (@Username, @Pass, @FirstName, @LastName, @UserRole);

        SET @UserID = SCOPE_IDENTITY();
    END

    -- ------------------------------------------------------------------------
    -- 4) CREATE MOTHER METER CONCESSIONER ACCOUNT IF NOT EXISTS
    -- ------------------------------------------------------------------------
    DECLARE @ExistingConcessionerID INT;

    SELECT TOP 1 @ExistingConcessionerID = c.ConcessionerID
    FROM dbo.tbl_Concessioner c
    WHERE c.AccountNumber = @AccountNumber
       OR c.MeterNumber = @MeterNumber
       OR c.UserID = @UserID;

    IF @ExistingConcessionerID IS NULL
    BEGIN
        DECLARE @AccountOrder INT;

        SELECT @AccountOrder = ISNULL(MAX(AccountOrder), 0) + 1
        FROM dbo.tbl_Concessioner
        WHERE DistrictID = @DistrictID;

        INSERT INTO dbo.tbl_Concessioner
        (
            UserID,
            CategoryID,
            MembershipID,
            DistrictID,
            AccountNumber,
            AccountOrder,
            MeterNumber,
            Address,
            ContactNumber,
            EmailAddress,
            Status
        )
        VALUES
        (
            @UserID,
            @CategoryID,
            @MembershipID,
            @DistrictID,
            @AccountNumber,
            @AccountOrder,
            @MeterNumber,
            @Address,
            @ContactNumber,
            @EmailAddress,
            @Status
        );

        SET @ExistingConcessionerID = SCOPE_IDENTITY();
    END

    -- Ensure mother meter account always uses the latest intended setup.
    UPDATE dbo.tbl_Concessioner
    SET CategoryID = @CategoryID,
        MembershipID = @MembershipID,
        DistrictID = @DistrictID,
        AccountNumber = @AccountNumber,
        MeterNumber = @MeterNumber,
        Address = @Address,
        ContactNumber = @ContactNumber,
        EmailAddress = @EmailAddress,
        Status = @Status
    WHERE ConcessionerID = @ExistingConcessionerID;

    -- ------------------------------------------------------------------------
    -- 5) UPSERT MOTHER METER BILLINGS FOR MONTHS 02, 03, 04
    --    Rules:
    --      a) one billing per selected period for mother meter
    --      b) mother meter consumption > total concessioner consumption
    --      c) bill amount always zero (Full Subsidy)
    -- ------------------------------------------------------------------------
    DECLARE @TargetYear INT;
    DECLARE @BillingUserID INT;
    DECLARE @BasePrevReading INT = 10000;

    SELECT @TargetYear = ISNULL(MAX(YEAR(PeriodStart)), YEAR(GETDATE()))
    FROM dbo.tbl_Period;

    SELECT TOP 1 @BillingUserID = UserID
    FROM dbo.tbl_User
    WHERE UserRole = 'Admin' AND IsDeleted = 0
    ORDER BY UserID;

    IF @BillingUserID IS NULL
        SET @BillingUserID = @UserID;

    DECLARE @TargetPeriods TABLE
    (
        RowNum INT NOT NULL,
        PeriodID INT NOT NULL,
        PeriodStart DATETIME NOT NULL,
        TargetConsumption INT NOT NULL,
        PrevReading INT NOT NULL,
        CurrentReading INT NOT NULL
    );

    ;WITH BasePeriods AS
    (
        SELECT
            p.PeriodID,
            p.PeriodStart,
            MONTH(p.PeriodStart) AS MonthNumber,
            ISNULL(
                (
                    SELECT SUM(b.CurrentReading - b.PrevReading)
                    FROM dbo.tbl_Billing b
                    INNER JOIN dbo.tbl_Concessioner c ON c.ConcessionerID = b.ConcessionerID
                    WHERE b.PeriodID = p.PeriodID
                      AND c.ConcessionerID <> @ExistingConcessionerID
                ),
                0
            ) AS TotalConcessionerConsumption
        FROM dbo.tbl_Period p
        WHERE YEAR(p.PeriodStart) = @TargetYear
          AND MONTH(p.PeriodStart) IN (2, 3, 4)
    ),
    OrderedPeriods AS
    (
        SELECT
            ROW_NUMBER() OVER (ORDER BY bp.PeriodStart ASC) AS RowNum,
            bp.PeriodID,
            bp.PeriodStart,
            CASE bp.MonthNumber
                WHEN 2 THEN bp.TotalConcessionerConsumption + 25
                WHEN 3 THEN bp.TotalConcessionerConsumption + 30
                WHEN 4 THEN bp.TotalConcessionerConsumption + 35
                ELSE bp.TotalConcessionerConsumption + 25
            END AS TargetConsumption
        FROM BasePeriods bp
    )
    INSERT INTO @TargetPeriods (RowNum, PeriodID, PeriodStart, TargetConsumption, PrevReading, CurrentReading)
    SELECT
        op.RowNum,
        op.PeriodID,
        op.PeriodStart,
        op.TargetConsumption,
        @BasePrevReading + ISNULL(
            (
                SELECT SUM(op2.TargetConsumption)
                FROM OrderedPeriods op2
                WHERE op2.RowNum < op.RowNum
            ),
            0
        ) AS PrevReading,
        @BasePrevReading + ISNULL(
            (
                SELECT SUM(op2.TargetConsumption)
                FROM OrderedPeriods op2
                WHERE op2.RowNum <= op.RowNum
            ),
            0
        ) AS CurrentReading
    FROM OrderedPeriods op;

    UPDATE b
    SET b.UserID = @BillingUserID,
        b.PrevReading = tp.PrevReading,
        b.CurrentReading = tp.CurrentReading,
        b.BillAmount = 0,
        b.Penalty = 0,
        b.BillStatus = N'Paid',
        b.CreatedAt = DATEADD(SECOND, 1, tp.PeriodStart)
    FROM dbo.tbl_Billing b
    INNER JOIN @TargetPeriods tp ON tp.PeriodID = b.PeriodID
    WHERE b.ConcessionerID = @ExistingConcessionerID;

    INSERT INTO dbo.tbl_Billing
    (
        ConcessionerID,
        UserID,
        PeriodID,
        PrevReading,
        CurrentReading,
        BillAmount,
        Penalty,
        BillStatus,
        CreatedAt
    )
    SELECT
        @ExistingConcessionerID,
        @BillingUserID,
        tp.PeriodID,
        tp.PrevReading,
        tp.CurrentReading,
        0,
        0,
        N'Paid',
        DATEADD(SECOND, 1, tp.PeriodStart)
    FROM @TargetPeriods tp
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.tbl_Billing b
        WHERE b.ConcessionerID = @ExistingConcessionerID
          AND b.PeriodID = tp.PeriodID
    );

    COMMIT TRAN;

    -- ------------------------------------------------------------------------
    -- 6) RESULT PREVIEW (for confirmation)
    -- ------------------------------------------------------------------------
    SELECT
        c.ConcessionerID,
        c.AccountNumber,
        c.MeterNumber,
        c.Status,
        c.AccountOrder,
        c.DistrictID,
        d.DistrictName,
        c.CategoryID,
        cat.CategoryName,
        c.MembershipID,
        m.MembershipName,
        u.UserID,
        u.Username,
        u.FirstName,
        u.LastName,
        u.UserRole,
        m.DiscountRate
    FROM dbo.tbl_Concessioner c
    INNER JOIN dbo.tbl_User u ON u.UserID = c.UserID
    INNER JOIN dbo.tbl_District d ON d.DistrictID = c.DistrictID
    INNER JOIN dbo.tbl_Category cat ON cat.CategoryID = c.CategoryID
    INNER JOIN dbo.tbl_Membership m ON m.MembershipID = c.MembershipID
    WHERE c.ConcessionerID = @ExistingConcessionerID;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    THROW;
END CATCH;
GO

-- ============================================================================
-- OPTIONAL: QUICK CHECK FOR MOTHER METER BILLING READINESS
-- (This verifies the account is available for billing/readings.)
-- ============================================================================
SELECT
    c.ConcessionerID,
    c.AccountNumber,
    c.MeterNumber,
    c.Status,
    u.Username,
    u.UserRole
FROM dbo.tbl_Concessioner c
INNER JOIN dbo.tbl_User u ON u.UserID = c.UserID
WHERE c.AccountNumber = N'ACC-MOTHER-0001'
   OR c.MeterNumber = N'MTR-MOTHER-0001';
GO

-- ============================================================================
-- OPTIONAL: CHECK MOTHER METER BILLINGS (MONTHS 02/03/04)
-- ============================================================================
SELECT
        p.PeriodID,
        p.PeriodStart,
        p.PeriodEnd,
        b.BillingID,
        b.PrevReading,
        b.CurrentReading,
        (b.CurrentReading - b.PrevReading) AS MotherMeterConsumption,
        b.BillAmount,
        b.Penalty,
        b.BillStatus
FROM dbo.tbl_Billing b
INNER JOIN dbo.tbl_Concessioner c ON c.ConcessionerID = b.ConcessionerID
INNER JOIN dbo.tbl_Period p ON p.PeriodID = b.PeriodID
WHERE (c.AccountNumber = N'ACC-MOTHER-0001' OR c.MeterNumber = N'MTR-MOTHER-0001')
    AND MONTH(p.PeriodStart) IN (2, 3, 4)
ORDER BY p.PeriodStart ASC;
GO
