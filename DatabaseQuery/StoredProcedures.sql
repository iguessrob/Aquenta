-- ============================================================================
-- AQUENTA WATER MANAGEMENT SYSTEM - STORED PROCEDURES
-- ============================================================================
-- Database: AquentaDB
-- Purpose: All CRUD operations, subquery-based reports, and aggregate functions
-- Ready to copy-paste into SQL Server Management Studio
-- ============================================================================

USE AquentaDB;
GO

-- ============================================================================
-- TBL_DISTRICT STORED PROCEDURES
-- ============================================================================

-- Get All Districts
CREATE PROCEDURE SP_GetAllDistrict
AS
BEGIN
	SELECT 
		DistrictID,
		DistrictName
	FROM tbl_District
	ORDER BY DistrictID;
END
GO

-- Get District By ID
CREATE PROCEDURE SP_GetDistrictById
	@DistrictID INT
AS
BEGIN
	SELECT 
		DistrictID,
		DistrictName
	FROM tbl_District
	WHERE DistrictID = @DistrictID;
END
GO

-- Insert District
CREATE PROCEDURE SP_InsertDistrict
	@DistrictName NVARCHAR(50)
AS
BEGIN
	INSERT INTO tbl_District (DistrictName)
	VALUES (@DistrictName);
	
	SELECT SCOPE_IDENTITY() AS DistrictID;
END
GO

-- Update District
CREATE PROCEDURE SP_UpdateDistrict
	@DistrictID INT,
	@DistrictName NVARCHAR(50)
AS
BEGIN
	UPDATE tbl_District
	SET DistrictName = @DistrictName
	WHERE DistrictID = @DistrictID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete District
CREATE PROCEDURE SP_DeleteDistrict
	@DistrictID INT
AS
BEGIN
	DELETE FROM tbl_District
	WHERE DistrictID = @DistrictID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_MEMBERSHIP STORED PROCEDURES
-- ============================================================================

-- Get All Memberships
CREATE PROCEDURE SP_GetAllMembership
AS
BEGIN
	SELECT 
		MembershipID,
		MembershipName,
		DiscountRate
	FROM tbl_Membership
	ORDER BY MembershipID;
END
GO

-- Get Membership By ID
CREATE PROCEDURE SP_GetMembershipById
	@MembershipID INT
AS
BEGIN
	SELECT 
		MembershipID,
		MembershipName,
		DiscountRate
	FROM tbl_Membership
	WHERE MembershipID = @MembershipID;
END
GO

-- Insert Membership
CREATE PROCEDURE SP_InsertMembership
	@MembershipName NVARCHAR(20),
	@DiscountRate DECIMAL(5,2)
AS
BEGIN
	INSERT INTO tbl_Membership (MembershipName, DiscountRate)
	VALUES (@MembershipName, @DiscountRate);
	
	SELECT SCOPE_IDENTITY() AS MembershipID;
END
GO

-- Update Membership
CREATE PROCEDURE SP_UpdateMembership
	@MembershipID INT,
	@MembershipName NVARCHAR(20),
	@DiscountRate DECIMAL(5,2)
AS
BEGIN
	UPDATE tbl_Membership
	SET MembershipName = @MembershipName,
		DiscountRate = @DiscountRate
	WHERE MembershipID = @MembershipID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete Membership
CREATE PROCEDURE SP_DeleteMembership
	@MembershipID INT
AS
BEGIN
	DELETE FROM tbl_Membership
	WHERE MembershipID = @MembershipID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_CATEGORY STORED PROCEDURES
-- ============================================================================

-- Get All Categories
CREATE PROCEDURE SP_GetAllCategory
AS
BEGIN
	SELECT 
		CategoryID,
		CategoryName
	FROM tbl_Category
	ORDER BY CategoryID;
END
GO

-- Get Category By ID
CREATE PROCEDURE SP_GetCategoryById
	@CategoryID INT
AS
BEGIN
	SELECT 
		CategoryID,
		CategoryName
	FROM tbl_Category
	WHERE CategoryID = @CategoryID;
END
GO

-- Insert Category
CREATE PROCEDURE SP_InsertCategory
	@CategoryName NVARCHAR(20)
AS
BEGIN
	INSERT INTO tbl_Category (CategoryName)
	VALUES (@CategoryName);
	
	SELECT SCOPE_IDENTITY() AS CategoryID;
END
GO

-- Update Category
CREATE PROCEDURE SP_UpdateCategory
	@CategoryID INT,
	@CategoryName NVARCHAR(20)
AS
BEGIN
	UPDATE tbl_Category
	SET CategoryName = @CategoryName
	WHERE CategoryID = @CategoryID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete Category
CREATE PROCEDURE SP_DeleteCategory
	@CategoryID INT
AS
BEGIN
	DELETE FROM tbl_Category
	WHERE CategoryID = @CategoryID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_TARIFFRATE STORED PROCEDURES
-- ============================================================================

-- Get All Tariff Rates
CREATE OR ALTER PROCEDURE SP_GetAllTariffRate
AS
BEGIN
	SET NOCOUNT ON;

	SELECT 
		RateID,
		CategoryID,
		TariffVersionID,
		CubicMeter,
		Amount
	FROM tbl_TariffRate
	ORDER BY TariffVersionID, CategoryID, CubicMeter;
END
GO

-- Get Tariff Rate By ID
CREATE OR ALTER PROCEDURE SP_GetTariffRateById
	@RateID INT
AS
BEGIN
	SET NOCOUNT ON;

	SELECT 
		RateID,
		CategoryID,
		TariffVersionID,
		CubicMeter,
		Amount
	FROM tbl_TariffRate
	WHERE RateID = @RateID;
END
GO

-- Get Tariff Rates By Category ID
CREATE OR ALTER PROCEDURE SP_GetTariffRateByCategoryId
	@CategoryID INT
AS
BEGIN
	SET NOCOUNT ON;

	SELECT 
		RateID,
		CategoryID,
		TariffVersionID,
		CubicMeter,
		Amount
	FROM tbl_TariffRate
	WHERE CategoryID = @CategoryID
	ORDER BY TariffVersionID, CubicMeter;
END
GO

-- Get Tariff Rates By Version ID
CREATE OR ALTER PROCEDURE SP_GetTariffRateByTariffVersionId
	@TariffVersionID INT
AS
BEGIN
	SET NOCOUNT ON;

	SELECT 
		RateID,
		CategoryID,
		TariffVersionID,
		CubicMeter,
		Amount
	FROM tbl_TariffRate
	WHERE TariffVersionID = @TariffVersionID
	ORDER BY CategoryID, CubicMeter;
END
GO

-- Insert Tariff Rate
CREATE OR ALTER PROCEDURE SP_InsertTariffRate
	@CategoryID INT,
	@TariffVersionID INT,
	@CubicMeter DECIMAL(5,2),
	@Amount DECIMAL(8,2)
AS
BEGIN
	SET NOCOUNT ON;

	INSERT INTO tbl_TariffRate (CategoryID, TariffVersionID, CubicMeter, Amount)
	VALUES (@CategoryID, @TariffVersionID, @CubicMeter, @Amount);
	
	SELECT SCOPE_IDENTITY() AS RateID;
END
GO

-- Update Tariff Rate
CREATE OR ALTER PROCEDURE SP_UpdateTariffRate
	@RateID INT,
	@CategoryID INT,
	@TariffVersionID INT,
	@CubicMeter DECIMAL(5,2),
	@Amount DECIMAL(8,2)
AS
BEGIN
	SET NOCOUNT ON;

	UPDATE tbl_TariffRate
	SET CategoryID = @CategoryID,
		TariffVersionID = @TariffVersionID,
		CubicMeter = @CubicMeter,
		Amount = @Amount
	WHERE RateID = @RateID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete Tariff Rate
CREATE OR ALTER PROCEDURE SP_DeleteTariffRate
	@RateID INT
AS
BEGIN
	SET NOCOUNT ON;

	DELETE FROM tbl_TariffRate
	WHERE RateID = @RateID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_TARIFFVERSION STORED PROCEDURES
-- ============================================================================

-- Get All Tariff Versions
CREATE OR ALTER PROCEDURE SP_GetAllTariffVersion
AS
BEGIN
	SET NOCOUNT ON;

	SELECT 
		TariffVersionID,
		VersionName,
		IsActive,
		CreatedAt
	FROM tbl_TariffVersion
	ORDER BY CreatedAt DESC, TariffVersionID DESC;
END
GO

-- Get Tariff Version By ID
CREATE OR ALTER PROCEDURE SP_GetTariffVersionById
	@TariffVersionID INT
AS
BEGIN
	SET NOCOUNT ON;

	SELECT 
		TariffVersionID,
		VersionName,
		IsActive,
		CreatedAt
	FROM tbl_TariffVersion
	WHERE TariffVersionID = @TariffVersionID;
END
GO

-- Get Active Tariff Version
CREATE OR ALTER PROCEDURE SP_GetActiveTariffVersion
AS
BEGIN
	SET NOCOUNT ON;

	SELECT TOP 1
		TariffVersionID,
		VersionName,
		IsActive,
		CreatedAt
	FROM tbl_TariffVersion
	WHERE IsActive = 1
	ORDER BY CreatedAt DESC, TariffVersionID DESC;
END
GO

-- Insert Tariff Version
CREATE OR ALTER PROCEDURE SP_InsertTariffVersion
	@VersionName NVARCHAR(100),
	@IsActive BIT
AS
BEGIN
	SET NOCOUNT ON;

	INSERT INTO tbl_TariffVersion (VersionName, IsActive)
	VALUES (@VersionName, @IsActive);

	SELECT SCOPE_IDENTITY() AS TariffVersionID;
END
GO

-- Create Tariff Version From Current And Set Active
CREATE OR ALTER PROCEDURE SP_CreateTariffVersionFromCurrent
	@VersionName NVARCHAR(100)
AS
BEGIN
	SET NOCOUNT ON;
	SET XACT_ABORT ON;

	DECLARE @CurrentTariffVersionID INT;
	DECLARE @NewTariffVersionID INT;

	BEGIN TRANSACTION;

	SELECT TOP 1 @CurrentTariffVersionID = TariffVersionID
	FROM tbl_TariffVersion
	WHERE IsActive = 1
	ORDER BY CreatedAt DESC, TariffVersionID DESC;

	UPDATE tbl_TariffVersion
	SET IsActive = 0
	WHERE IsActive = 1;

	INSERT INTO tbl_TariffVersion (VersionName, IsActive)
	VALUES (@VersionName, 1);

	SET @NewTariffVersionID = SCOPE_IDENTITY();

	IF @CurrentTariffVersionID IS NOT NULL
	BEGIN
		INSERT INTO tbl_TariffRate (CategoryID, TariffVersionID, CubicMeter, Amount)
		SELECT CategoryID, @NewTariffVersionID, CubicMeter, Amount
		FROM tbl_TariffRate
		WHERE TariffVersionID = @CurrentTariffVersionID;
	END

	COMMIT TRANSACTION;

	SELECT @NewTariffVersionID AS TariffVersionID;
END
GO

-- Update Tariff Version
CREATE OR ALTER PROCEDURE SP_UpdateTariffVersion
	@TariffVersionID INT,
	@VersionName NVARCHAR(100),
	@IsActive BIT
AS
BEGIN
	SET NOCOUNT ON;

	UPDATE tbl_TariffVersion
	SET VersionName = @VersionName,
		IsActive = @IsActive
	WHERE TariffVersionID = @TariffVersionID;

	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete Tariff Version
CREATE OR ALTER PROCEDURE SP_DeleteTariffVersion
	@TariffVersionID INT
AS
BEGIN
	SET NOCOUNT ON;

	DELETE FROM tbl_TariffVersion
	WHERE TariffVersionID = @TariffVersionID;

	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_USER STORED PROCEDURES
-- ============================================================================

-- Get All Users
CREATE PROCEDURE SP_GetAllUser
AS
BEGIN
	SELECT 
		UserID,
		Username,
		Pass,
		FirstName,
		LastName,
		UserRole,
		CreatedAt,
		IsDeleted
	FROM tbl_User
	ORDER BY UserID;
END
GO

-- Get User By ID
CREATE PROCEDURE SP_GetUserById
	@UserID INT
AS
BEGIN
	SELECT 
		UserID,
		Username,
		Pass,
		FirstName,
		LastName,
		UserRole,
		CreatedAt,
		IsDeleted
	FROM tbl_User
	WHERE UserID = @UserID;
END
GO

-- Get User By Username
CREATE PROCEDURE SP_GetUserByUsername
	@Username VARCHAR(50)
AS
BEGIN
	SELECT 
		UserID,
		Username,
		Pass,
		FirstName,
		LastName,
		UserRole,
		CreatedAt,
		IsDeleted
	FROM tbl_User
	WHERE Username = @Username;
END
GO

-- Insert User
CREATE PROCEDURE SP_InsertUser
	@Username VARCHAR(50),
	@Pass VARCHAR(255),
	@FirstName VARCHAR(50),
	@LastName VARCHAR(50),
	@UserRole VARCHAR(50)
AS
BEGIN
	INSERT INTO tbl_User (Username, Pass, FirstName, LastName, UserRole)
	VALUES (@Username, @Pass, @FirstName, @LastName, @UserRole);
	
	SELECT SCOPE_IDENTITY() AS UserID;
END
GO

-- Update User
CREATE PROCEDURE SP_UpdateUser
	@UserID INT,
	@Username VARCHAR(50),
	@Pass VARCHAR(255),
	@FirstName VARCHAR(50),
	@LastName VARCHAR(50),
	@UserRole VARCHAR(50)
AS
BEGIN
	UPDATE tbl_User
	SET Username = @Username,
		Pass = @Pass,
		FirstName = @FirstName,
		LastName = @LastName,
		UserRole = @UserRole
	WHERE UserID = @UserID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Soft Delete User (Update IsDeleted flag)
CREATE PROCEDURE SP_DeleteUser
	@UserID INT
AS
BEGIN
	UPDATE tbl_User
	SET IsDeleted = 1
	WHERE UserID = @UserID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Permanently Delete User
CREATE PROCEDURE SP_DeleteUserPermanent
	@UserID INT
AS
BEGIN
	DELETE FROM tbl_User
	WHERE UserID = @UserID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_CONCESSIONER STORED PROCEDURES
-- ============================================================================

-- Get All Concessioners
CREATE PROCEDURE SP_GetAllConcessioner
AS
BEGIN
	SELECT 
		c.ConcessionerID,
		c.UserID,
		c.CategoryID,
		c.MembershipID,
		c.DistrictID,
		c.AccountNumber,
		c.AccountOrder,
		c.MeterNumber,
		c.Address,
		c.ContactNumber,
		c.EmailAddress,
		c.Status,
		c.IsDeleted
	FROM tbl_Concessioner c
	LEFT JOIN tbl_District d ON c.DistrictID = d.DistrictID
	WHERE c.IsDeleted = 0
	ORDER BY
		CASE
			WHEN UPPER(LTRIM(RTRIM(d.DistrictName))) LIKE 'PUROK %'
			THEN TRY_CAST(REPLACE(UPPER(LTRIM(RTRIM(d.DistrictName))), 'PUROK ', '') AS INT)
			ELSE 9999
		END,
		c.AccountOrder,
		c.ConcessionerID;
END
GO

-- Get All Active Concessioners
CREATE PROCEDURE SP_GetAllActiveConcessioner
AS
BEGIN
	SELECT 
		c.ConcessionerID,
		c.UserID,
		c.CategoryID,
		c.MembershipID,
		c.DistrictID,
		c.AccountNumber,
		c.AccountOrder,
		c.MeterNumber,
		c.Address,
		c.ContactNumber,
		c.EmailAddress,
		c.Status,
		c.IsDeleted
	FROM tbl_Concessioner c
	LEFT JOIN tbl_District d ON c.DistrictID = d.DistrictID
	WHERE c.Status = 'Active' AND c.IsDeleted = 0
	ORDER BY
		CASE
			WHEN UPPER(LTRIM(RTRIM(d.DistrictName))) LIKE 'PUROK %'
			THEN TRY_CAST(REPLACE(UPPER(LTRIM(RTRIM(d.DistrictName))), 'PUROK ', '') AS INT)
			ELSE 9999
		END,
		c.AccountOrder,
		c.ConcessionerID;
END
GO

-- Get Concessioner By ID
CREATE PROCEDURE SP_GetConcessionerById
	@ConcessionerID INT
AS
BEGIN
	SELECT 
		ConcessionerID,
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
		Status,
		IsDeleted
	FROM tbl_Concessioner
	WHERE ConcessionerID = @ConcessionerID AND IsDeleted = 0;
END
GO

-- Get Concessioners By Status
CREATE PROCEDURE SP_GetConcessionerByStatus
	@Status NVARCHAR(20)
AS
BEGIN
	SELECT 
		c.ConcessionerID,
		c.UserID,
		c.CategoryID,
		c.MembershipID,
		c.DistrictID,
		c.AccountNumber,
		c.AccountOrder,
		c.MeterNumber,
		c.Address,
		c.ContactNumber,
		c.EmailAddress,
		c.Status,
		c.IsDeleted
	FROM tbl_Concessioner c
	LEFT JOIN tbl_District d ON c.DistrictID = d.DistrictID
	WHERE c.Status = @Status AND c.IsDeleted = 0
	ORDER BY
		CASE
			WHEN UPPER(LTRIM(RTRIM(d.DistrictName))) LIKE 'PUROK %'
			THEN TRY_CAST(REPLACE(UPPER(LTRIM(RTRIM(d.DistrictName))), 'PUROK ', '') AS INT)
			ELSE 9999
		END,
		c.AccountOrder,
		c.ConcessionerID;
END
GO

-- Get Concessioners By District ID
CREATE PROCEDURE SP_GetConcessionerByDistrictId
	@DistrictID INT
AS
BEGIN
	SELECT 
		ConcessionerID,
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
		Status,
		IsDeleted
	FROM tbl_Concessioner
	WHERE DistrictID = @DistrictID AND IsDeleted = 0
	ORDER BY AccountOrder, ConcessionerID;
END
GO

-- Get Concessioners By User ID
CREATE PROCEDURE SP_GetConcessionerByUserId
	@UserID INT
AS
BEGIN
	SELECT 
		c.ConcessionerID,
		c.UserID,
		c.CategoryID,
		c.MembershipID,
		c.DistrictID,
		c.AccountNumber,
		c.AccountOrder,
		c.MeterNumber,
		c.Address,
		c.ContactNumber,
		c.EmailAddress,
		c.Status,
		c.IsDeleted
	FROM tbl_Concessioner c
	LEFT JOIN tbl_District d ON c.DistrictID = d.DistrictID
	WHERE c.UserID = @UserID AND c.IsDeleted = 0
	ORDER BY
		CASE
			WHEN UPPER(LTRIM(RTRIM(d.DistrictName))) LIKE 'PUROK %'
			THEN TRY_CAST(REPLACE(UPPER(LTRIM(RTRIM(d.DistrictName))), 'PUROK ', '') AS INT)
			ELSE 9999
		END,
		c.AccountOrder,
		c.ConcessionerID;
END
GO

-- Insert Concessioner
CREATE PROCEDURE SP_InsertConcessioner
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

		INSERT INTO tbl_Concessioner (UserID, CategoryID, MembershipID, DistrictID, AccountNumber, AccountOrder, MeterNumber, Address, ContactNumber, EmailAddress, Status)
		VALUES (@UserID, @CategoryID, @MembershipID, @DistrictID, @AccountNumber, @AccountOrder, @MeterNumber, @Address, @ContactNumber, @EmailAddress, @Status);

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

-- Update Concessioner
CREATE PROCEDURE SP_UpdateConcessioner
	@ConcessionerID INT,
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
	UPDATE tbl_Concessioner
	SET UserID = @UserID,
		CategoryID = @CategoryID,
		MembershipID = @MembershipID,
		DistrictID = @DistrictID,
		AccountNumber = @AccountNumber,
		AccountOrder = @AccountOrder,
		MeterNumber = @MeterNumber,
		Address = @Address,
		ContactNumber = @ContactNumber,
		EmailAddress = @EmailAddress,
		Status = @Status
	WHERE ConcessionerID = @ConcessionerID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Soft Delete Concessioner
CREATE PROCEDURE SP_DeleteConcessioner
	@ConcessionerID INT
AS
BEGIN
	UPDATE tbl_Concessioner
	SET IsDeleted = 1
	WHERE ConcessionerID = @ConcessionerID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_PERIOD STORED PROCEDURES
-- ============================================================================

-- Get All Periods
CREATE PROCEDURE SP_GetAllPeriod
AS
BEGIN
	SELECT 
		PeriodID,
		PeriodStart,
		PeriodEnd
	FROM tbl_Period
	ORDER BY PeriodID DESC;
END
GO

-- Get Period By ID
CREATE PROCEDURE SP_GetPeriodById
	@PeriodID INT
AS
BEGIN
	SELECT 
		PeriodID,
		PeriodStart,
		PeriodEnd
	FROM tbl_Period
	WHERE PeriodID = @PeriodID;
END
GO

-- Get Latest Period
CREATE PROCEDURE SP_GetLatestPeriod
AS
BEGIN
	SELECT TOP 1
		PeriodID,
		PeriodStart,
		PeriodEnd
	FROM tbl_Period
	ORDER BY PeriodEnd DESC;
END
GO

-- Insert Period
CREATE PROCEDURE SP_InsertPeriod
	@PeriodStart DATETIME,
	@PeriodEnd DATETIME
AS
BEGIN
	INSERT INTO tbl_Period (PeriodStart, PeriodEnd)
	VALUES (@PeriodStart, @PeriodEnd);
	
	SELECT SCOPE_IDENTITY() AS PeriodID;
END
GO

-- Update Period
CREATE PROCEDURE SP_UpdatePeriod
	@PeriodID INT,
	@PeriodStart DATETIME,
	@PeriodEnd DATETIME
AS
BEGIN
	UPDATE tbl_Period
	SET PeriodStart = @PeriodStart,
		PeriodEnd = @PeriodEnd
	WHERE PeriodID = @PeriodID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete Period
CREATE PROCEDURE SP_DeletePeriod
	@PeriodID INT
AS
BEGIN
	DELETE FROM tbl_Period
	WHERE PeriodID = @PeriodID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_BILLING STORED PROCEDURES
-- ============================================================================

-- Get All Billings
CREATE PROCEDURE SP_GetAllBilling
AS
BEGIN
	SELECT 
		BillingID,
		ConcessionerID,
		UserID,
		PeriodID,
		PrevReading,
		CurrentReading,
		BillAmount,
		Penalty,
		BillStatus,
		CreatedAt
	FROM tbl_Billing
	ORDER BY BillingID DESC;
END
GO

-- Get Billing By ID
CREATE PROCEDURE SP_GetBillingById
	@BillingID INT
AS
BEGIN
	SELECT 
		BillingID,
		ConcessionerID,
		UserID,
		PeriodID,
		PrevReading,
		CurrentReading,
		BillAmount,
		Penalty,
		BillStatus,
		CreatedAt
	FROM tbl_Billing
	WHERE BillingID = @BillingID;
END
GO

-- Get Billings By Concessioner ID
CREATE PROCEDURE SP_GetBillingByConcessionerId
	@ConcessionerID INT
AS
BEGIN
	SELECT 
		b.BillingID,
		b.ConcessionerID,
		b.UserID,
		b.PeriodID,
		b.PrevReading,
		b.CurrentReading,
		b.BillAmount,
		b.Penalty,
		b.BillStatus,
		b.CreatedAt,
		p.PeriodStart,
		p.PeriodEnd
	FROM tbl_Billing b
	INNER JOIN tbl_Period p ON b.PeriodID = p.PeriodID
	WHERE b.ConcessionerID = @ConcessionerID
	ORDER BY b.CreatedAt DESC;
END
GO

-- Get Billings By Status
CREATE PROCEDURE SP_GetBillingByStatus
	@BillStatus NVARCHAR(50)
AS
BEGIN
	SELECT 
		BillingID,
		ConcessionerID,
		UserID,
		PeriodID,
		PrevReading,
		CurrentReading,
		BillAmount,
		Penalty,
		BillStatus,
		CreatedAt
	FROM tbl_Billing
	WHERE BillStatus = @BillStatus
	ORDER BY CreatedAt DESC;
END
GO

-- Insert Billing
CREATE PROCEDURE SP_InsertBilling
	@ConcessionerID INT,
	@UserID INT,
	@PeriodID INT,
	@PrevReading INT,
	@CurrentReading INT,
	@BillAmount DECIMAL(10,2),
	@BillStatus NVARCHAR(50),
	@Penalty DECIMAL(10,2) = 0,
	@CreatedAt DATETIME = NULL
AS
BEGIN
	INSERT INTO tbl_Billing (ConcessionerID, UserID, PeriodID, PrevReading, CurrentReading, BillAmount, Penalty, BillStatus, CreatedAt)
	VALUES (@ConcessionerID, @UserID, @PeriodID, @PrevReading, @CurrentReading, @BillAmount, @Penalty, @BillStatus, ISNULL(@CreatedAt, GETDATE()));
	
	SELECT SCOPE_IDENTITY() AS BillingID;
END
GO

-- Update Billing
CREATE PROCEDURE SP_UpdateBilling
	@BillingID INT,
	@ConcessionerID INT,
	@UserID INT,
	@PeriodID INT,
	@PrevReading INT,
	@CurrentReading INT,
	@BillAmount DECIMAL(10,2),
	@Penalty DECIMAL(10,2),
	@BillStatus NVARCHAR(50),
	@CreatedAt DATETIME = NULL
AS
BEGIN
	UPDATE tbl_Billing
	SET ConcessionerID = @ConcessionerID,
		UserID = @UserID,
		PeriodID = @PeriodID,
		PrevReading = @PrevReading,
		CurrentReading = @CurrentReading,
		BillAmount = @BillAmount,
		Penalty = @Penalty,
		BillStatus = @BillStatus,
		CreatedAt = ISNULL(@CreatedAt, CreatedAt)
	WHERE BillingID = @BillingID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete Billing
CREATE PROCEDURE SP_DeleteBilling
	@BillingID INT
AS
BEGIN
	DELETE FROM tbl_Billing
	WHERE BillingID = @BillingID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- TBL_PAYMENT STORED PROCEDURES
-- ============================================================================

-- Get All Payments
CREATE PROCEDURE SP_GetAllPayment
AS
BEGIN
	SELECT 
		ISNULL(p.PaymentID, 0) AS PaymentID,
		b.BillingID,
		ISNULL(p.AmountPaid, 0) AS AmountPaid,
		p.DatePaid,
		b.BillAmount,
		b.Penalty,
		b.BillStatus,
		b.ConcessionerID,
		per.PeriodStart,
		per.PeriodEnd,
		ISNULL(arrCalc.Arrears, 0) AS Arrears
	FROM tbl_Billing b
	LEFT JOIN tbl_Payment p ON b.BillingID = p.BillingID
	INNER JOIN tbl_Period per ON b.PeriodID = per.PeriodID
	CROSS APPLY (
		SELECT SUM(outstanding) AS Arrears
		FROM (
			SELECT 
				b2.BillAmount + ISNULL(b2.Penalty, 0)
				- ISNULL((SELECT SUM(p2.AmountPaid) FROM tbl_Payment p2 WHERE p2.BillingID = b2.BillingID), 0)
				AS outstanding
			FROM tbl_Billing b2
			INNER JOIN tbl_Period per2 ON b2.PeriodID = per2.PeriodID
			WHERE b2.ConcessionerID = b.ConcessionerID
			  AND per2.PeriodEnd < per.PeriodEnd
			  AND b2.BillStatus IN ('Unpaid', 'Overdue', 'Partial')
		) sub
		WHERE sub.outstanding > 0
	) arrCalc
	ORDER BY b.BillingID DESC;
END
GO

-- Get Payment By ID
CREATE PROCEDURE SP_GetPaymentById
	@PaymentID INT
AS
BEGIN
	SELECT 
		PaymentID,
		BillingID,
		AmountPaid,
		DatePaid
	FROM tbl_Payment
	WHERE PaymentID = @PaymentID;
END
GO

-- Get Payments By Billing ID
CREATE PROCEDURE SP_GetPaymentByBillingId
	@BillingID INT
AS
BEGIN
	SELECT 
		PaymentID,
		BillingID,
		AmountPaid,
		DatePaid
	FROM tbl_Payment
	WHERE BillingID = @BillingID
	ORDER BY DatePaid DESC;
END
GO

-- Insert Payment
CREATE PROCEDURE SP_InsertPayment
	@BillingID INT,
	@AmountPaid DECIMAL(10,2),
	@DatePaid DATETIME = NULL
AS
BEGIN
	INSERT INTO tbl_Payment (BillingID, AmountPaid, DatePaid)
	VALUES (@BillingID, @AmountPaid, ISNULL(@DatePaid, GETDATE()));
	
	SELECT SCOPE_IDENTITY() AS PaymentID;
END
GO

-- Update Payment
CREATE PROCEDURE SP_UpdatePayment
	@PaymentID INT,
	@BillingID INT,
	@AmountPaid DECIMAL(10,2),
	@DatePaid DATETIME
AS
BEGIN
	UPDATE tbl_Payment
	SET BillingID = @BillingID,
		AmountPaid = @AmountPaid,
		DatePaid = @DatePaid
	WHERE PaymentID = @PaymentID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete Payment
CREATE PROCEDURE SP_DeletePayment
	@PaymentID INT
AS
BEGIN
	DELETE FROM tbl_Payment
	WHERE PaymentID = @PaymentID;
	
	SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ============================================================================
-- AGGREGATE FUNCTION STORED PROCEDURES (REPORTS)
-- ============================================================================

-- Show Total Active Concessioners
CREATE PROCEDURE SP_ShowTotalActiveConcessioners
	@Status VARCHAR(50)
AS
BEGIN
	SELECT COUNT(ConcessionerID) AS TotalActiveConcessioners
	FROM tbl_Concessioner 
	WHERE Status = @Status;
END
GO

-- Get Monthly Water Consumption (Latest Month or by Date Range)
CREATE PROCEDURE SP_GetMonthlyWaterConsumption
	@StartDate DATETIME,
	@EndDate DATETIME
AS 
BEGIN
	SELECT SUM(b.CurrentReading - b.PrevReading) AS WaterConsumed
	FROM tbl_Billing b
	INNER JOIN tbl_Concessioner c ON c.ConcessionerID = b.ConcessionerID
	INNER JOIN tbl_User u ON u.UserID = c.UserID
	WHERE b.CreatedAt >= @StartDate AND b.CreatedAt < @EndDate
	  AND UPPER(LTRIM(RTRIM(ISNULL(u.FirstName, '')))) <> 'MOTHER METER';
END
GO

-- Show Sum Amount of Pending Concessioner (Unpaid Bills)
CREATE PROCEDURE SP_ShowSumAmountofPendingConcessioner
	@BillStatus VARCHAR(50)
AS
BEGIN
	SELECT 
	SUM(BillAmount) AS PendingCollections
	FROM tbl_Billing b
	INNER JOIN tbl_Concessioner c ON c.ConcessionerID = b.ConcessionerID
	INNER JOIN tbl_User u ON u.UserID = c.UserID
	WHERE b.BillStatus <> 'Paid'
	  AND UPPER(LTRIM(RTRIM(ISNULL(u.FirstName, '')))) <> 'MOTHER METER';
END
GO

-- Count Total Concessioners
CREATE PROCEDURE SP_GetTotalConcessioners
AS
BEGIN
	SELECT COUNT(ConcessionerID) AS TotalConcessioners
	FROM tbl_Concessioner;
END
GO

-- Get Total Billing Amount by Period
CREATE PROCEDURE SP_GetTotalBillingByPeriod
	@PeriodID INT
AS
BEGIN
	SELECT 
		SUM(BillAmount) AS TotalBillingAmount,
		COUNT(BillingID) AS TotalBills,
		SUM(Penalty) AS TotalPenalty
	FROM tbl_Billing
	WHERE PeriodID = @PeriodID;
END
GO

-- Get Total Payment Collections
CREATE PROCEDURE SP_GetTotalPaymentCollections
	@StartDate DATETIME,
	@EndDate DATETIME
AS
BEGIN
	SELECT 
		SUM(AmountPaid) AS TotalPaymentCollected,
		COUNT(PaymentID) AS TotalPayments
	FROM tbl_Payment
	WHERE DatePaid >= @StartDate AND DatePaid < @EndDate;
END
GO

-- Get Unpaid Bills Count and Amount
CREATE PROCEDURE SP_GetUnpaidBillsSummary
AS
BEGIN
	SELECT 
		COUNT(BillingID) AS UnpaidBillsCount,
		SUM(BillAmount + Penalty) AS TotalUnpaidAmount
	FROM tbl_Billing
	WHERE BillStatus IN ('Unpaid', 'Overdue');
END
GO

-- Get Overdue Bills Summary
CREATE PROCEDURE SP_GetOverdueBillsSummary
AS
BEGIN
	SELECT 
		COUNT(BillingID) AS OverdueBillsCount,
		SUM(BillAmount + Penalty) AS TotalOverdueAmount
	FROM tbl_Billing
	WHERE BillStatus = 'Overdue';
END
GO

-- ============================================================================
-- SUBQUERY-BASED STORED PROCEDURES (ADVANCED REPORTS)
-- ============================================================================

-- District Water Consumption Summary by Latest Period
-- Purpose: Identifies districts with the highest water usage
CREATE PROCEDURE SP_GetDistrictConsumptionSummary
AS
BEGIN
	SELECT 
		d.DistrictID,
		d.DistrictName,
		COUNT(DISTINCT c.ConcessionerID) AS TotalCustomers,
		SUM(b.CurrentReading - b.PrevReading) AS TotalConsumption,
		AVG(b.CurrentReading - b.PrevReading) AS AvgConsumption
	FROM tbl_Billing b
	INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID
	INNER JOIN tbl_District d ON c.DistrictID = d.DistrictID
	WHERE b.CreatedAt >= (
		SELECT DATEADD(MONTH, DATEDIFF(MONTH, 0, MAX(b2.CreatedAt)), 0)
		FROM tbl_Billing b2
	)
	AND b.CreatedAt < (
		SELECT DATEADD(MONTH, DATEDIFF(MONTH, 0, MAX(b2.CreatedAt)) + 1, 0)
		FROM tbl_Billing b2
	)
	GROUP BY d.DistrictID, d.DistrictName
	HAVING SUM(b.CurrentReading - b.PrevReading) > 0
	ORDER BY TotalConsumption DESC;
END
GO

-- Comprehensive Billing Report with Payment Details
-- Purpose: Shows all customer bills with their payment status and billing history
CREATE PROCEDURE SP_GetBillingWithPaymentSummary
AS
BEGIN
	SELECT 
		c.AccountNumber,
		c.Address,
		cat.CategoryName,
		u.FirstName,
		u.LastName,
		b.BillingID,
		b.BillAmount,
		b.Penalty,
		b.BillStatus,
		b.CreatedAt,
		ISNULL((SELECT SUM(p.AmountPaid) FROM tbl_Payment p WHERE p.BillingID = b.BillingID), 0) AS TotalPaid,
		(b.CurrentReading - b.PrevReading) AS Consumption,
		(SELECT COUNT(*) FROM tbl_Payment p WHERE p.BillingID = b.BillingID) AS PaymentCount,
		(SELECT SUM(b2.BillAmount) FROM tbl_Billing b2 WHERE b2.ConcessionerID = c.ConcessionerID) AS TotalBills
	FROM tbl_Billing b
	INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID
	INNER JOIN tbl_Category cat ON c.CategoryID = cat.CategoryID
	INNER JOIN tbl_User u ON c.UserID = u.UserID
	ORDER BY b.BillingID DESC;
END
GO

-- Active Customers with Debt and Water Usage Summary
-- Purpose: Provides a financial and usage summary for all Active customers
CREATE PROCEDURE SP_GetActiveCustomerDebtAndUsageSummary
AS
BEGIN
	SELECT 
		u.FirstName,
		u.LastName,
		c.AccountNumber,
		d.DistrictName AS District,
		m.MembershipName AS Membership,
		ISNULL((SELECT SUM(b.BillAmount + b.Penalty) 
				FROM tbl_Billing b
				WHERE b.ConcessionerID = c.ConcessionerID AND b.BillStatus IN ('Unpaid', 'Overdue')), 0) AS TotalOwed,
		SUM(b.CurrentReading - b.PrevReading) AS TotalWaterUsed
	FROM tbl_Concessioner c
	INNER JOIN tbl_User u ON c.UserID = u.UserID
	INNER JOIN tbl_District d ON c.DistrictID = d.DistrictID
	INNER JOIN tbl_Membership m ON c.MembershipID = m.MembershipID
	LEFT JOIN tbl_Billing b ON c.ConcessionerID = b.ConcessionerID
	WHERE c.Status = 'Active'
	GROUP BY u.FirstName, u.LastName, c.AccountNumber, d.DistrictName, m.MembershipName, c.ConcessionerID
	ORDER BY TotalWaterUsed DESC;
END
GO

-- Arrear Summary Report
-- Purpose: Shows unpaid and overdue balances (including current month) and penalties.
CREATE PROCEDURE SP_GetArrearSummaryReport
AS
BEGIN
	;WITH PaymentTotals AS
	(
		SELECT
			BillingID,
			SUM(AmountPaid) AS TotalPaid
		FROM tbl_Payment
		GROUP BY BillingID
	),
	ArrearRows AS
	(
		SELECT
			c.ConcessionerID,
			c.AccountNumber,
			u.FirstName,
			u.LastName,
			d.DistrictName,
			b.PeriodID,
			p.PeriodEnd,
			ISNULL(b.Penalty, 0) AS Penalty,
			CASE
				WHEN (b.BillAmount + ISNULL(b.Penalty, 0) - ISNULL(pt.TotalPaid, 0)) > 0
				THEN (b.BillAmount + ISNULL(b.Penalty, 0) - ISNULL(pt.TotalPaid, 0))
				ELSE 0
			END AS OutstandingAmount
		FROM tbl_Billing b
		INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID
		INNER JOIN tbl_User u ON c.UserID = u.UserID
		INNER JOIN tbl_District d ON c.DistrictID = d.DistrictID
		INNER JOIN tbl_Period p ON b.PeriodID = p.PeriodID
		LEFT JOIN PaymentTotals pt ON pt.BillingID = b.BillingID
		WHERE b.BillStatus IN ('Unpaid', 'Overdue')
	)
	SELECT
		ConcessionerID,
		AccountNumber,
		FirstName,
		LastName,
		DistrictName,
		SUM(OutstandingAmount) AS TotalArrears,
		SUM(Penalty) AS TotalPenalty,
		COUNT(DISTINCT PeriodID) AS MonthsWithBalance,
		MIN(PeriodEnd) AS EarliestArrearPeriod,
		MAX(PeriodEnd) AS LatestArrearPeriod
	FROM ArrearRows
	WHERE OutstandingAmount > 0
	GROUP BY ConcessionerID, AccountNumber, FirstName, LastName, DistrictName
	HAVING SUM(OutstandingAmount) > 0
	ORDER BY TotalArrears DESC, LastName, FirstName;
END
GO



-- Delinquent Customers Report
-- Purpose: Shows customers with delinquent status and their outstanding debts
CREATE PROCEDURE SP_GetDelinquentCustomersReport
AS
BEGIN
	SELECT 
		u.FirstName + ' ' + u.LastName AS FullName,
		c.AccountNumber,
		c.Address,
		c.ContactNumber,
		c.Status,
		d.DistrictName,
		COUNT(DISTINCT b.BillingID) AS UnpaidBillCount,
		SUM(b.BillAmount + ISNULL(b.Penalty, 0)) AS TotalDebt,
		MIN(b.CreatedAt) AS EarliestBillDate,
		MAX(b.CreatedAt) AS LatestBillDate
	FROM tbl_Concessioner c
	INNER JOIN tbl_User u ON c.UserID = u.UserID
	INNER JOIN tbl_District d ON c.DistrictID = d.DistrictID
	INNER JOIN tbl_Billing b ON c.ConcessionerID = b.ConcessionerID
	WHERE c.Status = 'Delinquent' AND b.BillStatus IN ('Unpaid', 'Overdue')
	GROUP BY u.FirstName, u.LastName, c.AccountNumber, c.Address, c.ContactNumber, c.Status, d.DistrictName
	ORDER BY TotalDebt DESC;
END
GO

-- Collection Performance Summary by User (Admin/Collector)
-- Purpose: Shows payment collections by each admin/collector
CREATE PROCEDURE SP_GetCollectionPerformanceSummary
	@StartDate DATETIME,
	@EndDate DATETIME
AS
BEGIN
	SELECT 
		u.UserID,
		u.FirstName + ' ' + u.LastName AS CollectorName,
		COUNT(DISTINCT p.PaymentID) AS PaymentCount,
		SUM(p.AmountPaid) AS TotalAmountCollected,
		COUNT(DISTINCT CASE WHEN b.BillStatus = 'Paid' THEN b.BillingID END) AS BillsProcessed
	FROM tbl_User u
	INNER JOIN tbl_Billing b ON u.UserID = b.UserID
	INNER JOIN tbl_Payment p ON b.BillingID = p.BillingID
	WHERE p.DatePaid >= @StartDate AND p.DatePaid < @EndDate
	GROUP BY u.UserID, u.FirstName, u.LastName
	ORDER BY TotalAmountCollected DESC;
END
GO

-- Monthly Revenue Report
-- Purpose: Shows monthly billing and payment trends
CREATE PROCEDURE SP_GetMonthlyRevenueReport
	@Year INT
AS
BEGIN
	SELECT 
		DATEFROMPARTS(@Year, MONTH(b.CreatedAt), 1) AS Month,
		COUNT(DISTINCT b.BillingID) AS TotalBillings,
		SUM(b.BillAmount) AS TotalBillAmount,
		SUM(b.Penalty) AS TotalPenalty,
		ISNULL(SUM(p.AmountPaid), 0) AS TotalPaymentCollected,
		SUM(b.BillAmount) - ISNULL(SUM(p.AmountPaid), 0) AS OutstandingAmount
	FROM tbl_Billing b
	LEFT JOIN tbl_Payment p ON b.BillingID = p.BillingID
	WHERE YEAR(b.CreatedAt) = @Year
	GROUP BY MONTH(b.CreatedAt)
	ORDER BY MONTH(b.CreatedAt);
END
GO

-- Monthly Consumption Report
-- Purpose: Shows monthly water consumption trends
CREATE PROCEDURE SP_GetMonthlyConsumptionReport
	@Year INT
AS
BEGIN
	SELECT 
		MONTH(b.CreatedAt) AS MonthIndex,
		SUM(b.CurrentReading - b.PrevReading) AS TotalConsumption
	FROM tbl_Billing b
	WHERE YEAR(b.CreatedAt) = @Year
	GROUP BY MONTH(b.CreatedAt)
	ORDER BY MonthIndex;
END
GO

-- Customer Account Status Detail Report
-- Purpose: Detailed account status with contact and billing information
CREATE PROCEDURE SP_GetCustomerAccountDetailReport
	@ConcessionerID INT
AS
BEGIN
	SELECT 
		c.ConcessionerID,
		c.AccountNumber,
		c.MeterNumber,
		u.FirstName + ' ' + u.LastName AS CustomerName,
		u.Username,
		c.Address,
		c.ContactNumber,
		c.EmailAddress,
		d.DistrictName,
		cat.CategoryName,
		m.MembershipName,
		m.DiscountRate,
		c.Status,
		COUNT(DISTINCT b.BillingID) AS TotalBillsGenerated,
		COUNT(DISTINCT CASE WHEN b.BillStatus = 'Paid' THEN b.BillingID END) AS PaidBills,
		COUNT(DISTINCT CASE WHEN b.BillStatus IN ('Unpaid', 'Overdue') THEN b.BillingID END) AS UnpaidBills,
		SUM(CASE WHEN b.BillStatus IN ('Unpaid', 'Overdue') THEN b.BillAmount + ISNULL(b.Penalty, 0) ELSE 0 END) AS TotalOutstanding,
		SUM(b.CurrentReading - b.PrevReading) AS TotalWaterConsumed
	FROM tbl_Concessioner c
	INNER JOIN tbl_User u ON c.UserID = u.UserID
	INNER JOIN tbl_District d ON c.DistrictID = d.DistrictID
	INNER JOIN tbl_Category cat ON c.CategoryID = cat.CategoryID
	INNER JOIN tbl_Membership m ON c.MembershipID = m.MembershipID
	LEFT JOIN tbl_Billing b ON c.ConcessionerID = b.ConcessionerID
	WHERE c.ConcessionerID = @ConcessionerID
	GROUP BY c.ConcessionerID, c.AccountNumber, c.MeterNumber, u.FirstName, u.LastName, u.Username,
			 c.Address, c.ContactNumber, c.EmailAddress, d.DistrictName, cat.CategoryName, m.MembershipName, m.DiscountRate, c.Status;
END
GO

-- Monthly Mother Meter vs Concessioner Consumption Report
-- Purpose: Returns monthly mother meter consumption, concessioner consumption,
--          and water loss where WaterLoss = MotherMeterConsumption - ConcessionerConsumption
CREATE PROCEDURE SP_GetMonthlyMotherMeterWaterLossReport
	@Year INT,
	@MotherFirstName NVARCHAR(100) = N'MOTHER METER',
	@MotherAccountNumber NVARCHAR(20) = N'ACC-MOTHER-0001',
	@MotherMeterNumber NVARCHAR(30) = N'MTR-MOTHER-0001'
AS
BEGIN
	;WITH Months AS
	(
		SELECT 1 AS MonthIndex UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
		UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
		UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
	),
	ConsumptionByMonth AS
	(
		SELECT
			MONTH(COALESCE(p.PeriodEnd, p.PeriodStart)) AS MonthIndex,
			SUM(CASE
					WHEN UPPER(LTRIM(RTRIM(ISNULL(u.FirstName, '')))) = UPPER(@MotherFirstName)
					  OR UPPER(LTRIM(RTRIM(c.AccountNumber))) = UPPER(@MotherAccountNumber)
					  OR UPPER(LTRIM(RTRIM(c.MeterNumber))) = UPPER(@MotherMeterNumber)
					THEN (b.CurrentReading - b.PrevReading)
					ELSE 0
				END) AS MotherMeterConsumption,
			SUM(CASE
					WHEN UPPER(LTRIM(RTRIM(ISNULL(u.FirstName, '')))) = UPPER(@MotherFirstName)
					  OR UPPER(LTRIM(RTRIM(c.AccountNumber))) = UPPER(@MotherAccountNumber)
					  OR UPPER(LTRIM(RTRIM(c.MeterNumber))) = UPPER(@MotherMeterNumber)
					THEN 0
					ELSE (b.CurrentReading - b.PrevReading)
				END) AS ConcessionerConsumption
		FROM tbl_Billing b
		INNER JOIN tbl_Concessioner c ON c.ConcessionerID = b.ConcessionerID
		INNER JOIN tbl_User u ON u.UserID = c.UserID
		INNER JOIN tbl_Period p ON p.PeriodID = b.PeriodID
		WHERE YEAR(COALESCE(p.PeriodEnd, p.PeriodStart)) = @Year
		GROUP BY MONTH(COALESCE(p.PeriodEnd, p.PeriodStart))
	)
	SELECT
		m.MonthIndex,
		ISNULL(cb.MotherMeterConsumption, 0) AS MotherMeterConsumption,
		ISNULL(cb.ConcessionerConsumption, 0) AS ConcessionerConsumption,
		ISNULL(cb.MotherMeterConsumption, 0) - ISNULL(cb.ConcessionerConsumption, 0) AS WaterLoss
	FROM Months m
	LEFT JOIN ConsumptionByMonth cb ON cb.MonthIndex = m.MonthIndex
	ORDER BY m.MonthIndex;
END
GO

-- ============================================================================
-- PAYMENT DISTRIBUTION STORED PROCEDURES
-- ============================================================================

-- Distribute Payment (Arrears-First Waterfall Logic)
CREATE PROCEDURE SP_DistributePayment
	@ConcessionerID INT,
	@TotalAmountPaid DECIMAL(10,2),
	@CurrentBillingID INT
AS
BEGIN
	SET NOCOUNT ON;

	IF @TotalAmountPaid <= 0
	BEGIN
		RAISERROR('Amount paid must be greater than zero.', 16, 1);
		RETURN;
	END

	-- Build distribution using running totals (oldest billing first)
	;WITH Unpaid AS (
		SELECT b.BillingID,
			   b.BillAmount + ISNULL(b.Penalty, 0) AS BillTotal,
			   ISNULL(pt.TotalPaid, 0) AS ExistingPaid,
			   b.BillAmount + ISNULL(b.Penalty, 0) - ISNULL(pt.TotalPaid, 0) AS Outstanding
		FROM tbl_Billing b
		INNER JOIN tbl_Period p ON b.PeriodID = p.PeriodID
		LEFT JOIN (
			SELECT BillingID, SUM(AmountPaid) AS TotalPaid
			FROM tbl_Payment GROUP BY BillingID
		) pt ON pt.BillingID = b.BillingID
		WHERE b.ConcessionerID = @ConcessionerID
		  AND b.BillStatus IN ('Unpaid', 'Overdue', 'Partial')
		  AND (b.BillAmount + ISNULL(b.Penalty, 0) - ISNULL(pt.TotalPaid, 0)) > 0
	),
	RunningTotals AS (
		SELECT BillingID, BillTotal, ExistingPaid, Outstanding,
			   SUM(Outstanding) OVER (ORDER BY BillingID) AS CumulativeOutstanding
		FROM Unpaid
	)
	SELECT BillingID, BillTotal, ExistingPaid, Outstanding, CumulativeOutstanding,
		   -- Amount to apply to this billing
		   CASE
			 WHEN @TotalAmountPaid >= CumulativeOutstanding THEN Outstanding
			 WHEN @TotalAmountPaid > CumulativeOutstanding - Outstanding THEN @TotalAmountPaid - (CumulativeOutstanding - Outstanding)
			 ELSE 0
		   END AS ApplyAmount
	INTO #Distribution
	FROM RunningTotals;

	-- Validate: reject overpayment
	DECLARE @TotalOutstanding DECIMAL(10,2) = (SELECT ISNULL(SUM(Outstanding), 0) FROM #Distribution);

	IF @TotalAmountPaid > @TotalOutstanding
	BEGIN
		DROP TABLE #Distribution;
		DECLARE @Msg NVARCHAR(200) = 'Amount paid (' + CAST(@TotalAmountPaid AS NVARCHAR(20))
			+ ') exceeds total outstanding (' + CAST(@TotalOutstanding AS NVARCHAR(20)) + ').';
		RAISERROR(@Msg, 16, 1);
		RETURN;
	END

	BEGIN TRANSACTION;
	BEGIN TRY
		-- Update existing payment records
		UPDATE p SET p.AmountPaid = d.ExistingPaid + d.ApplyAmount, p.DatePaid = GETDATE()
		FROM tbl_Payment p INNER JOIN #Distribution d ON p.BillingID = d.BillingID
		WHERE d.ApplyAmount > 0;

		-- Insert payment records for billings that don't have one yet
		INSERT INTO tbl_Payment (BillingID, AmountPaid, DatePaid)
		SELECT d.BillingID, d.ApplyAmount, GETDATE()
		FROM #Distribution d
		WHERE d.ApplyAmount > 0
		  AND NOT EXISTS (SELECT 1 FROM tbl_Payment p WHERE p.BillingID = d.BillingID);

		-- Update billing statuses
		UPDATE b SET b.BillStatus = CASE WHEN d.ExistingPaid + d.ApplyAmount >= d.BillTotal THEN 'Paid' ELSE 'Unpaid' END
		FROM tbl_Billing b INNER JOIN #Distribution d ON b.BillingID = d.BillingID
		WHERE d.ApplyAmount > 0;

		COMMIT TRANSACTION;
	END TRY
	BEGIN CATCH
		ROLLBACK TRANSACTION;
		DROP TABLE #Distribution;
		THROW;
	END CATCH

	DROP TABLE #Distribution;

	-- Return updated payments for this concessioner
	SELECT p.PaymentID, p.BillingID, p.AmountPaid, p.DatePaid,
		   b.BillAmount, b.Penalty, b.BillStatus, per.PeriodStart, per.PeriodEnd
	FROM tbl_Payment p
	INNER JOIN tbl_Billing b ON p.BillingID = b.BillingID
	INNER JOIN tbl_Period per ON b.PeriodID = per.PeriodID
	WHERE b.ConcessionerID = @ConcessionerID
	ORDER BY per.PeriodEnd ASC;
END
GO

-- Reverse Payment Distribution
CREATE PROCEDURE SP_ReverseDistribution
	@ConcessionerID INT
AS
BEGIN
	SET NOCOUNT ON;

	UPDATE p SET p.AmountPaid = 0, p.DatePaid = GETDATE()
	FROM tbl_Payment p
	INNER JOIN tbl_Billing b ON p.BillingID = b.BillingID
	WHERE b.ConcessionerID = @ConcessionerID;

	UPDATE tbl_Billing SET BillStatus = 'Unpaid'
	WHERE ConcessionerID = @ConcessionerID AND BillStatus IN ('Paid', 'Partial');

	SELECT p.PaymentID, p.BillingID, p.AmountPaid, p.DatePaid,
		   b.BillAmount, b.Penalty, b.BillStatus, per.PeriodStart, per.PeriodEnd
	FROM tbl_Payment p
	INNER JOIN tbl_Billing b ON p.BillingID = b.BillingID
	INNER JOIN tbl_Period per ON b.PeriodID = per.PeriodID
	WHERE b.ConcessionerID = @ConcessionerID
	ORDER BY per.PeriodEnd ASC;
END
GO

-- ============================================================================
-- END OF STORED PROCEDURES
-- ============================================================================

PRINT 'All Stored Procedures created successfully!';
GO
