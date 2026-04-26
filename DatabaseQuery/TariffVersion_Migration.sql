-- ============================================================================
-- AQUENTA TARIFF PRESET (VERSION) MIGRATION - SINGLE TABLE APPROACH
-- Consolidates Tariff Versioning into tbl_TariffRate as presets.
-- ============================================================================

SET NOCOUNT ON;
GO

-- 1. Cleanup old table and foreign keys/constraints if they exist
-- We need to be aggressive here to handle different naming conventions from previous attempts.

-- Drop any FKs referencing tbl_TariffVersion
DECLARE @SqlFK NVARCHAR(MAX) = '';
SELECT @SqlFK += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
                 ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.foreign_keys
WHERE referenced_object_id = OBJECT_ID('tbl_TariffVersion');

IF @SqlFK <> '' EXEC sp_executesql @SqlFK;

-- Drop any constraints on tbl_TariffRate that involve TariffVersionID
DECLARE @SqlDrops NVARCHAR(MAX) = '';

-- 1. Handle Constraints (Unique, Foreign Key, etc.)
SELECT @SqlDrops += 'IF OBJECT_ID(''' + QUOTENAME(name) + ''', ''C'') IS NOT NULL OR OBJECT_ID(''' + QUOTENAME(name) + ''', ''F'') IS NOT NULL OR OBJECT_ID(''' + QUOTENAME(name) + ''', ''PK'') IS NOT NULL OR OBJECT_ID(''' + QUOTENAME(name) + ''', ''UQ'') IS NOT NULL ' +
                    'ALTER TABLE [tbl_TariffRate] DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.objects
WHERE parent_object_id = OBJECT_ID('tbl_TariffRate')
AND (name LIKE '%TariffVersion%' OR name LIKE '%TariffRate_Version%');

-- 2. Handle Indexes (that are NOT constraints)
SELECT @SqlDrops += 'IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = ''' + i.name + ''' AND object_id = OBJECT_ID(''tbl_TariffRate'')) ' +
                    'DROP INDEX ' + QUOTENAME(i.name) + ' ON [tbl_TariffRate];' + CHAR(13)
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('tbl_TariffRate') 
AND c.name = 'TariffVersionID'
AND i.is_primary_key = 0 AND i.is_unique_constraint = 0;

IF @SqlDrops <> '' EXEC sp_executesql @SqlDrops;

IF OBJECT_ID('dbo.tbl_TariffVersion', 'U') IS NOT NULL DROP TABLE tbl_TariffVersion;
GO

-- 2. Add columns to tbl_TariffRate
IF COL_LENGTH('dbo.tbl_TariffRate', 'VersionName') IS NULL
BEGIN
    ALTER TABLE tbl_TariffRate
    ADD VersionName NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.tbl_TariffRate', 'IsActive') IS NULL
BEGIN
    ALTER TABLE tbl_TariffRate
    ADD IsActive BIT NOT NULL DEFAULT 0;
END
GO

-- 3. Cleanup old TariffVersionID column if it exists
IF COL_LENGTH('dbo.tbl_TariffRate', 'TariffVersionID') IS NOT NULL
BEGIN
    ALTER TABLE tbl_TariffRate DROP COLUMN TariffVersionID;
END
GO

-- 4. Initialize first preset if empty
IF NOT EXISTS (SELECT 1 FROM tbl_TariffRate WHERE VersionName IS NOT NULL)
BEGIN
    UPDATE tbl_TariffRate
    SET VersionName = 'Version 1.0 (Dec 2025 - Feb 2026)',
        IsActive = 1
    WHERE VersionName IS NULL;
END
GO

-- 5. Ensure VersionName is NOT NULL for future entries
ALTER TABLE tbl_TariffRate ALTER COLUMN VersionName NVARCHAR(100) NOT NULL;
GO

-- ----------------------------------------------------------------------------
-- STORED PROCEDURES (REFACTORED FOR SINGLE TABLE)
-- ----------------------------------------------------------------------------

-- Get All Tariff Rates (By Version Name)
CREATE OR ALTER PROCEDURE SP_GetAllTariffRate
AS
BEGIN
    SET NOCOUNT ON;
    SELECT RateID, CategoryID, VersionName, IsActive, CubicMeter, Amount
    FROM tbl_TariffRate
    ORDER BY VersionName, CategoryID, CubicMeter;
END
GO

CREATE OR ALTER PROCEDURE SP_GetTariffRateById
    @RateID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT RateID, CategoryID, VersionName, IsActive, CubicMeter, Amount
    FROM tbl_TariffRate
    WHERE RateID = @RateID;
END
GO

CREATE OR ALTER PROCEDURE SP_GetTariffRateByVersionName
    @VersionName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT RateID, CategoryID, VersionName, IsActive, CubicMeter, Amount
    FROM tbl_TariffRate
    WHERE VersionName = @VersionName
    ORDER BY CategoryID, CubicMeter;
END
GO

CREATE OR ALTER PROCEDURE SP_InsertTariffRate
    @CategoryID INT,
    @VersionName NVARCHAR(100),
    @IsActive BIT,
    @CubicMeter DECIMAL(5,2),
    @Amount DECIMAL(8,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO tbl_TariffRate (CategoryID, VersionName, IsActive, CubicMeter, Amount)
    VALUES (@CategoryID, @VersionName, @IsActive, @CubicMeter, @Amount);
    SELECT SCOPE_IDENTITY() AS RateID;
END
GO

CREATE OR ALTER PROCEDURE SP_UpdateTariffRate
    @RateID INT,
    @CategoryID INT,
    @VersionName NVARCHAR(100),
    @IsActive BIT,
    @CubicMeter DECIMAL(5,2),
    @Amount DECIMAL(8,2)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tbl_TariffRate
    SET CategoryID = @CategoryID,
        VersionName = @VersionName,
        IsActive = @IsActive,
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
    DELETE FROM tbl_TariffRate WHERE RateID = @RateID;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- PRESET (VERSION) MANAGEMENT PROCEDURES

CREATE OR ALTER PROCEDURE SP_GetAllTariffVersion
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT 
        VersionName, 
        IsActive,
        (SELECT MAX(RateID) FROM tbl_TariffRate r2 WHERE r2.VersionName = r1.VersionName) as SortID
    FROM tbl_TariffRate r1
    ORDER BY IsActive DESC, SortID DESC;
END
GO

CREATE OR ALTER PROCEDURE SP_GetActiveTariffVersion
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT TOP 1 VersionName, IsActive
    FROM tbl_TariffRate
    WHERE IsActive = 1;
END
GO

CREATE OR ALTER PROCEDURE SP_CreateTariffVersionFromCurrent
    @VersionName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRANSACTION;

    -- 1. Deactivate current active preset
    UPDATE tbl_TariffRate SET IsActive = 0 WHERE IsActive = 1;

    -- 2. Clone rates into new preset and set as active
    INSERT INTO tbl_TariffRate (CategoryID, VersionName, IsActive, CubicMeter, Amount)
    SELECT CategoryID, @VersionName, 1, CubicMeter, Amount
    FROM tbl_TariffRate
    WHERE VersionName = (SELECT TOP 1 VersionName FROM (SELECT DISTINCT VersionName, IsActive FROM tbl_TariffRate) t WHERE IsActive = 0 ORDER BY VersionName DESC); -- Fallback or specific logic

    -- Actually, safer to just use the one we just deactivated
    -- Let's re-query it before deactivation or use a variable
    
    COMMIT TRANSACTION;
    
    SELECT @VersionName AS VersionName;
END
GO

-- Better version of CreateFromCurrent
CREATE OR ALTER PROCEDURE SP_CreateTariffVersionFromCurrent
    @NewVersionName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    DECLARE @OldActiveName NVARCHAR(100);
    SELECT TOP 1 @OldActiveName = VersionName FROM tbl_TariffRate WHERE IsActive = 1;

    BEGIN TRANSACTION;

    UPDATE tbl_TariffRate SET IsActive = 0 WHERE IsActive = 1;

    INSERT INTO tbl_TariffRate (CategoryID, VersionName, IsActive, CubicMeter, Amount)
    SELECT CategoryID, @NewVersionName, 1, CubicMeter, Amount
    FROM tbl_TariffRate
    WHERE VersionName = @OldActiveName;

    COMMIT TRANSACTION;
    
    SELECT @NewVersionName AS VersionName;
END
GO

CREATE OR ALTER PROCEDURE SP_SetActiveTariffVersion
    @VersionName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;
    UPDATE tbl_TariffRate SET IsActive = 0;
    UPDATE tbl_TariffRate SET IsActive = 1 WHERE VersionName = @VersionName;
    COMMIT TRANSACTION;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE SP_UpdateTariffVersionName
    @OldName NVARCHAR(100),
    @NewName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tbl_TariffRate
    SET VersionName = @NewName
    WHERE VersionName = @OldName;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

CREATE OR ALTER PROCEDURE SP_DeleteTariffVersion
    @VersionName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM tbl_TariffRate WHERE VersionName = @VersionName;
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
