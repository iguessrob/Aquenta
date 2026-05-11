USE AquentaDB;
GO

IF OBJECT_ID('dbo.tbl_LandingPageSettings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_LandingPageSettings
    (
        LandingPageSettingsID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        PageKey NVARCHAR(50) NOT NULL CONSTRAINT UQ_tbl_LandingPageSettings_PageKey UNIQUE,
        PageTitle NVARCHAR(200) NOT NULL,
        PageSubtitle NVARCHAR(500) NULL,
        OfficeName NVARCHAR(200) NOT NULL,
        AddressLine1 NVARCHAR(200) NOT NULL,
        AddressLine2 NVARCHAR(200) NULL,
        OfficeHoursWeekdays NVARCHAR(150) NULL,
        OfficeHoursClosed NVARCHAR(150) NULL,
        LandlineNumber NVARCHAR(50) NULL,
        EmailAddress NVARCHAR(120) NULL,
        GoogleMapsEmbedUrl NVARCHAR(1000) NULL,
        GoogleMapsPlaceId NVARCHAR(200) NULL,
        MapLatitude DECIMAL(10, 7) NULL,
        MapLongitude DECIMAL(10, 7) NULL,
        MapZoomLevel INT NULL CONSTRAINT CK_tbl_LandingPageSettings_MapZoomLevel CHECK (MapZoomLevel IS NULL OR (MapZoomLevel BETWEEN 1 AND 21)),
        IsActive BIT NOT NULL CONSTRAINT DF_tbl_LandingPageSettings_IsActive DEFAULT (1),
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_tbl_LandingPageSettings_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_tbl_LandingPageSettings_UpdatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedBy NVARCHAR(100) NULL,
        CONSTRAINT CK_tbl_LandingPageSettings_MapLatitude CHECK (MapLatitude IS NULL OR (MapLatitude BETWEEN -90 AND 90)),
        CONSTRAINT CK_tbl_LandingPageSettings_MapLongitude CHECK (MapLongitude IS NULL OR (MapLongitude BETWEEN -180 AND 180))
    );
END
GO

IF OBJECT_ID('dbo.tbl_LandingPageFaq', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_LandingPageFaq
    (
        LandingPageFaqID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Question NVARCHAR(300) NOT NULL,
        Answer NVARCHAR(1000) NOT NULL,
        SortOrder INT NOT NULL CONSTRAINT DF_tbl_LandingPageFaq_SortOrder DEFAULT (0),
        IsActive BIT NOT NULL CONSTRAINT DF_tbl_LandingPageFaq_IsActive DEFAULT (1),
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_LandingPageSettings WHERE PageKey = 'Home')
BEGIN
    INSERT INTO dbo.tbl_LandingPageSettings
    (
        PageKey,
        PageTitle,
        PageSubtitle,
        OfficeName,
        AddressLine1,
        AddressLine2,
        OfficeHoursWeekdays,
        OfficeHoursClosed,
        LandlineNumber,
        EmailAddress,
        GoogleMapsEmbedUrl,
        GoogleMapsPlaceId,
        MapLatitude,
        MapLongitude,
        MapZoomLevel,
        UpdatedBy
    )
    VALUES
    (
        'Home',
        'Frequently Asked Questions',
        'Keep the landing page content current without editing HTML.',
        'St. Joseph Water Billing Cooperative',
        'San Jose Sto. Tomas City Batangas',
        NULL,
        'Monday - Saturday: 8:00 AM - 5:00 PM',
        'Sunday & Holidays: Closed',
        '0433329827',
        'stjosephstb@gmail.com',
        NULL,
        NULL,
        NULL,
        NULL,
        15,
        'SYSTEM'
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_tbl_LandingPageFaq_IsActive_SortOrder'
      AND object_id = OBJECT_ID('dbo.tbl_LandingPageFaq')
)
BEGIN
    CREATE INDEX IX_tbl_LandingPageFaq_IsActive_SortOrder
        ON dbo.tbl_LandingPageFaq (IsActive, SortOrder, LandingPageFaqID);
END
GO