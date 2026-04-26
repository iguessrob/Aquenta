-- ============================================================================
-- AQUEANTA TARIFF VERSION MIGRATION
-- Updates tbl_TariffRate to reference tbl_TariffVersion and adds TariffVersion CRUD.
-- ============================================================================

SET NOCOUNT ON;
GO

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

IF OBJECT_ID('dbo.tbl_TariffVersion', 'U') IS NULL
BEGIN
    CREATE TABLE tbl_TariffVersion (
        TariffVersionID INT IDENTITY(1,1) PRIMARY KEY,
        VersionName NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

IF COL_LENGTH('dbo.tbl_TariffRate', 'TariffVersionID') IS NULL
BEGIN
    ALTER TABLE tbl_TariffRate
    ADD TariffVersionID INT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.tbl_TariffVersion
    WHERE VersionName = 'Version 1.0 (Dec 2025 - Feb2026)'
)
BEGIN
    INSERT INTO dbo.tbl_TariffVersion (VersionName, IsActive, CreatedAt)
    VALUES ('Version 1.0 (Dec 2025 - Feb2026)', 1, GETDATE());
END
GO

DECLARE @DefaultTariffVersionID INT;
SELECT TOP 1 @DefaultTariffVersionID = TariffVersionID
FROM dbo.tbl_TariffVersion
ORDER BY IsActive DESC, CreatedAt DESC, TariffVersionID DESC;

IF @DefaultTariffVersionID IS NOT NULL
BEGIN
    UPDATE dbo.tbl_TariffRate
    SET TariffVersionID = @DefaultTariffVersionID
    WHERE TariffVersionID IS NULL;
END
GO

IF COL_LENGTH('dbo.tbl_TariffRate', 'TariffVersionID') IS NOT NULL
BEGIN
    ALTER TABLE tbl_TariffRate
    ALTER COLUMN TariffVersionID INT NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_tbl_TariffRate_tbl_TariffVersion'
)
BEGIN
    ALTER TABLE tbl_TariffRate
    ADD CONSTRAINT FK_tbl_TariffRate_tbl_TariffVersion
    FOREIGN KEY (TariffVersionID) REFERENCES tbl_TariffVersion(TariffVersionID);
END
GO


-- ----------------------------------------------------------------------------
-- TARIFF RATE STORED PROCEDURES
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- TARIFF VERSION STORED PROCEDURES
-- ----------------------------------------------------------------------------

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
