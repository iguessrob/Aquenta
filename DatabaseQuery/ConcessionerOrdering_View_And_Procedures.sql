-- ============================================================================
-- AQUENTA WATER MANAGEMENT SYSTEM - CONCESSIONER ORDERING VIEW + PROCEDURES
-- ============================================================================
-- Purpose:
-- 1) Centralize concessioner display ordering logic in one reusable view
-- 2) Sort by District (Purok 1..7) then AccountOrder
-- 3) Reuse the same ordering across concessioner listing procedures
--
-- Run this file in SQL Server Management Studio against AquentaDB.
-- This script is safe to re-run because it uses CREATE OR ALTER.
-- ============================================================================

USE AquentaDB;
GO

-- ============================================================================
-- VIEW: vw_ConcessionerOrdered
-- ============================================================================
-- Adds a reusable SortDistrictOrder field derived from DistrictName.
-- Expected names: Purok 1 ... Purok 7
-- Non-matching district names are pushed to the bottom (9999).
-- ============================================================================
CREATE OR ALTER VIEW dbo.vw_ConcessionerOrdered
AS
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
    d.DistrictName,
    CASE
        WHEN UPPER(LTRIM(RTRIM(d.DistrictName))) LIKE 'PUROK %'
            THEN ISNULL(TRY_CAST(REPLACE(UPPER(LTRIM(RTRIM(d.DistrictName))), 'PUROK ', '') AS INT), 9999)
        ELSE 9999
    END AS SortDistrictOrder
FROM tbl_Concessioner c
LEFT JOIN tbl_District d ON c.DistrictID = d.DistrictID;
GO

-- ============================================================================
-- PROCEDURES USING vw_ConcessionerOrdered
-- ============================================================================

-- Get All Concessioners
CREATE OR ALTER PROCEDURE SP_GetAllConcessioner
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
        Status
    FROM dbo.vw_ConcessionerOrdered
    ORDER BY SortDistrictOrder, AccountOrder, ConcessionerID;
END
GO

-- Get All Active Concessioners
CREATE OR ALTER PROCEDURE SP_GetAllActiveConcessioner
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
        Status
    FROM dbo.vw_ConcessionerOrdered
    WHERE Status = 'Active'
    ORDER BY SortDistrictOrder, AccountOrder, ConcessionerID;
END
GO

-- Get Concessioners By Status
CREATE OR ALTER PROCEDURE SP_GetConcessionerByStatus
    @Status NVARCHAR(20)
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
        Status
    FROM dbo.vw_ConcessionerOrdered
    WHERE Status = @Status
    ORDER BY SortDistrictOrder, AccountOrder, ConcessionerID;
END
GO

-- Get Concessioners By District ID
CREATE OR ALTER PROCEDURE SP_GetConcessionerByDistrictId
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
        Status
    FROM dbo.vw_ConcessionerOrdered
    WHERE DistrictID = @DistrictID
    ORDER BY AccountOrder, ConcessionerID;
END
GO

-- Get Concessioners By User ID
CREATE OR ALTER PROCEDURE SP_GetConcessionerByUserId
    @UserID INT
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
        Status
    FROM dbo.vw_ConcessionerOrdered
    WHERE UserID = @UserID
    ORDER BY SortDistrictOrder, AccountOrder, ConcessionerID;
END
GO

PRINT 'Concessioner ordering view and procedures updated successfully.';
GO
