USE AquentaDB;
GO

CREATE OR ALTER PROCEDURE SP_InsertConcessioner
    @UserID INT,
    @CategoryID INT,
    @MembershipID INT,
    @DistrictID INT,
    @AccountNumber NVARCHAR(20),
    @AccountOrder INT,
    @MeterNumber NVARCHAR(30),
    @Address NVARCHAR(255),
    @ContactNumber NVARCHAR(15),
    @EmailAddress NVARCHAR(50),
    @Status NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF @AccountOrder IS NULL OR @AccountOrder < 1
    BEGIN
        RAISERROR('AccountOrder must be a positive whole number.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE tbl_Concessioner
        SET AccountOrder = AccountOrder + 1
        WHERE DistrictID = @DistrictID
          AND AccountOrder >= @AccountOrder;

        INSERT INTO tbl_Concessioner (
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
        VALUES (
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

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS ConcessionerID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END
GO

PRINT 'SP_InsertConcessioner now auto-shifts AccountOrder within the same district.';
GO
