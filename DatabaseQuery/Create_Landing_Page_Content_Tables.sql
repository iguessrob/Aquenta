USE AquentaDB;
GO

IF OBJECT_ID('dbo.tbl_LandingPageSettings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_LandingPageSettings
    (
        LandingPageSettingsID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        OfficeName NVARCHAR(200) NOT NULL,
        Address NVARCHAR(500) NOT NULL,
        OfficeHours NVARCHAR(250) NOT NULL,
        LandlineNumber NVARCHAR(50) NULL,
        EmailAddress NVARCHAR(120) NULL,
        GoogleMapsEmbedCode NVARCHAR(MAX) NULL
    );
END
GO

IF OBJECT_ID('dbo.tbl_LandingPageFaq', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_LandingPageFaq
    (
        LandingPageFaqID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Question NVARCHAR(300) NOT NULL,
        Answer NVARCHAR(MAX) NOT NULL,
        SortOrder INT NOT NULL CONSTRAINT DF_tbl_LandingPageFaq_SortOrder DEFAULT (0)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_LandingPageSettings)
BEGIN
    INSERT INTO dbo.tbl_LandingPageSettings
    (
        OfficeName,
        Address,
        OfficeHours,
        LandlineNumber,
        EmailAddress,
        GoogleMapsEmbedCode
    )
    VALUES
    (
        'St. Joseph Water Billing Cooperative',
        'San Jose Sto. Tomas City Batangas',
        'Monday - Saturday: 8:00AM - 5:00PM' + CHAR(13) + CHAR(10) + 'Sunday & Holidays: Closed',
        '0433329827',
        'stjosephstb@gmail.com',
        '<iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d266.94339329535796!2d121.19827834920255!3d14.073350479111523!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd6897606f6737%3A0xa29996840e78ee8!2sSt.%20Joseph%20Multipurpose%20Cooperative!5e0!3m2!1sen!2sph!4v1770888268426!5m2!1sen!2sph" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="St. Joseph Multipurpose Cooperative Location"></iframe>'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_LandingPageFaq)
BEGIN
    INSERT INTO dbo.tbl_LandingPageFaq
    (
        Question,
        Answer,
        SortOrder
    )
    VALUES
    (
        'Can I update my personal information online?',
        'Basic account details may be viewable online, but major changes (like name or address) must be requested at the cooperative office for verification.',
        1
    ),
    (
        'What happens if I miss a payment?',
        'Late payments may incur additional charges. Please contact our office immediately if you anticipate difficulty meeting a payment deadline to discuss possible arrangements.',
        2
    ),
    (
        'I forgot my password. What should I do?',
        'Click on the "Forgot Password" link on the login page. You''ll receive instructions via email to reset your password securely.',
        3
    ),
    (
        'Why was a penalty added to my bill?',
        'Penalties are typically added for late payments or missed payment deadlines. Check your billing statement for specific details or contact our office for clarification.',
        4
    ),
    (
        'Is my personal and billing information secure?',
        'Yes, we use industry-standard encryption and security measures to protect all customer data. Your information is stored securely and is only accessible to authorized personnel.',
        5
    ),
    (
        'What if I cannot log in to my account?',
        'First, try resetting your password. If issues persist, contact our support team with your account number and we''ll help you regain access to your account.',
        6
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_tbl_LandingPageFaq_SortOrder'
      AND object_id = OBJECT_ID('dbo.tbl_LandingPageFaq')
)
BEGIN
    CREATE INDEX IX_tbl_LandingPageFaq_SortOrder
        ON dbo.tbl_LandingPageFaq (SortOrder, LandingPageFaqID);
END
GO