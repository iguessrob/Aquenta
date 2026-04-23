USE AquentaDB;
GO

IF OBJECT_ID('dbo.tbl_ContactSubmission', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_ContactSubmission
    (
        ContactSubmissionID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FullName NVARCHAR(100) NOT NULL,
        AccountNumber NVARCHAR(50) NULL,
        ContactNumber NVARCHAR(30) NOT NULL,
        Email NVARCHAR(120) NOT NULL,
        Subject NVARCHAR(100) NOT NULL,
        Message NVARCHAR(300) NOT NULL,
        SubmittedAt DATETIME2 NOT NULL CONSTRAINT DF_tbl_ContactSubmission_SubmittedAt DEFAULT SYSUTCDATETIME(),
        Status NVARCHAR(30) NOT NULL CONSTRAINT DF_tbl_ContactSubmission_Status DEFAULT 'New'
    );
END
GO
