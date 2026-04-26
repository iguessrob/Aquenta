-- ============================================================================
-- AQUENTA TARIFF VERSIONING MIGRATION - MULTI-TABLE APPROACH
-- Restores tbl_TariffVersion as a separate table.
-- ============================================================================

SET NOCOUNT ON;
GO

-- 1. Cleanup existing columns/tables if they exist to start fresh
-- Drop constraints first
DECLARE @Sql NVARCHAR(MAX) = '';
SELECT @Sql += 'ALTER TABLE tbl_TariffRate DROP CONSTRAINT ' + QUOTENAME(d.name) + ';' + CHAR(13)
FROM sys.default_constraints d
INNER JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
WHERE d.parent_object_id = OBJECT_ID('tbl_TariffRate')
AND c.name IN ('VersionName', 'IsActive', 'TariffVersionID');

IF @Sql <> '' EXEC sp_executesql @Sql;

-- Drop columns if they exist
IF COL_LENGTH('tbl_TariffRate', 'VersionName') IS NOT NULL ALTER TABLE tbl_TariffRate DROP COLUMN VersionName;
IF COL_LENGTH('tbl_TariffRate', 'IsActive') IS NOT NULL ALTER TABLE tbl_TariffRate DROP COLUMN IsActive;
GO

-- Drop existing FK if it exists
IF OBJECT_ID('dbo.FK_TariffRate_Version', 'F') IS NOT NULL
BEGIN
    ALTER TABLE tbl_TariffRate DROP CONSTRAINT FK_TariffRate_Version;
END
GO

-- 2. Create/Restore tbl_TariffVersion
IF OBJECT_ID('dbo.tbl_TariffVersion', 'U') IS NULL
BEGIN
    CREATE TABLE tbl_TariffVersion (
        TariffVersionID INT PRIMARY KEY IDENTITY(1,1),
        VersionName NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Insert a default version if none exists
    INSERT INTO tbl_TariffVersion (VersionName, IsActive)
    VALUES ('Version 1.0', 1);
END
GO

-- 3. Restore TariffVersionID in tbl_TariffRate
IF COL_LENGTH('tbl_TariffRate', 'TariffVersionID') IS NULL
BEGIN
    ALTER TABLE tbl_TariffRate ADD TariffVersionID INT;
END
GO

-- Populate the column (Separate batch to ensure it exists)
IF COL_LENGTH('tbl_TariffRate', 'TariffVersionID') IS NOT NULL
BEGIN
    -- Map existing rates to the active version if they don't have one
    DECLARE @ActiveID INT;
    SELECT TOP 1 @ActiveID = TariffVersionID FROM tbl_TariffVersion WHERE IsActive = 1;
    
    -- Using EXEC to avoid compile-time error if column was just added
    DECLARE @PopulateSql NVARCHAR(MAX) = 'UPDATE tbl_TariffRate SET TariffVersionID = ' + CAST(@ActiveID AS NVARCHAR) + ' WHERE TariffVersionID IS NULL';
    EXEC sp_executesql @PopulateSql;

    -- Make it NOT NULL
    ALTER TABLE tbl_TariffRate ALTER COLUMN TariffVersionID INT NOT NULL;

    -- Add FK if it doesn't exist
    IF OBJECT_ID('dbo.FK_TariffRate_Version', 'F') IS NULL
    BEGIN
        ALTER TABLE tbl_TariffRate ADD CONSTRAINT FK_TariffRate_Version 
        FOREIGN KEY (TariffVersionID) REFERENCES tbl_TariffVersion(TariffVersionID);
    END
END
GO

-- ----------------------------------------------------------------------------
-- STORED PROCEDURES (REFACTORED FOR MULTI-TABLE)
-- ----------------------------------------------------------------------------

-- Get All Versions
CREATE OR ALTER PROCEDURE SP_GetAllTariffVersion
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TariffVersionID, VersionName, IsActive, CreatedAt
    FROM tbl_TariffVersion
    ORDER BY IsActive DESC, CreatedAt DESC;
END
GO

-- Get Active Version
CREATE OR ALTER PROCEDURE SP_GetActiveTariffVersion
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 TariffVersionID, VersionName, IsActive, CreatedAt
    FROM tbl_TariffVersion
    WHERE IsActive = 1;
END
GO

-- Get Rates By Version ID
CREATE OR ALTER PROCEDURE SP_GetTariffRateByVersionId
    @TariffVersionID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT RateID, CategoryID, TariffVersionID, CubicMeter, Amount
    FROM tbl_TariffRate
    WHERE TariffVersionID = @TariffVersionID
    ORDER BY CategoryID, CubicMeter;
END
GO

-- Create New Version from Current Active
CREATE OR ALTER PROCEDURE SP_CreateTariffVersionFromCurrent
    @NewVersionName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1. Get current active version
        DECLARE @OldActiveID INT;
        SELECT TOP 1 @OldActiveID = TariffVersionID FROM tbl_TariffVersion WHERE IsActive = 1;

        -- 2. Deactivate all
        UPDATE tbl_TariffVersion SET IsActive = 0;

        -- 3. Create new version
        INSERT INTO tbl_TariffVersion (VersionName, IsActive)
        VALUES (@NewVersionName, 1);
        
        DECLARE @NewID INT = SCOPE_IDENTITY();

        -- 4. Copy rates from old active to new
        IF @OldActiveID IS NOT NULL
        BEGIN
            INSERT INTO tbl_TariffRate (CategoryID, TariffVersionID, CubicMeter, Amount)
            SELECT CategoryID, @NewID, CubicMeter, Amount
            FROM tbl_TariffRate
            WHERE TariffVersionID = @OldActiveID;
        END

        COMMIT;
        SELECT @NewID AS NewID;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO

-- Set Active Version
CREATE OR ALTER PROCEDURE SP_SetActiveTariffVersion
    @TariffVersionID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE tbl_TariffVersion SET IsActive = 0;
        UPDATE tbl_TariffVersion SET IsActive = 1 WHERE TariffVersionID = @TariffVersionID;
        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO

-- Update Version Name
CREATE OR ALTER PROCEDURE SP_UpdateTariffVersionName
    @TariffVersionID INT,
    @NewName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tbl_TariffVersion SET VersionName = @NewName WHERE TariffVersionID = @TariffVersionID;
END
GO

-- Delete Version (and its rates)
CREATE OR ALTER PROCEDURE SP_DeleteTariffVersion
    @TariffVersionID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1. Delete associated rates first
        DELETE FROM tbl_TariffRate WHERE TariffVersionID = @TariffVersionID;

        -- 2. Delete the version record
        DELETE FROM tbl_TariffVersion WHERE TariffVersionID = @TariffVersionID;

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
GO
