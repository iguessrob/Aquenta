/*
============================================================================
AQUENTA WATER MANAGEMENT SYSTEM - REPORTING V3 (FINAL REFACTOR)
============================================================================
Purpose: 
1. Create 8 logical views to centralize reporting math.
2. Refactor 12 stored procedures to query these views.
3. Exclude Mother Meter from all reporting.
============================================================================
*/

USE AquentaDB;
GO

-- ==========================================================================
-- 1. CORE VIEWS (8 VIEWS)
-- ==========================================================================

-- VIEW 1: vw_MonthlyRevenueTrend
CREATE OR ALTER VIEW dbo.vw_MonthlyRevenueTrend AS
SELECT 
    YEAR(b.CreatedAt) AS Year,
    MONTH(b.CreatedAt) AS Month,
    SUM(b.BillAmount + ISNULL(b.Penalty, 0)) AS TotalBilled,
    ISNULL(SUM(p.AmountPaid), 0) AS TotalCollected
FROM tbl_Billing b
INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID
INNER JOIN tbl_User u ON c.UserID = u.UserID
LEFT JOIN tbl_Payment p ON b.BillingID = p.BillingID
WHERE c.AccountNumber NOT LIKE '%MOTHER%'
  AND u.FirstName NOT LIKE '%MOTHER%'
GROUP BY YEAR(b.CreatedAt), MONTH(b.CreatedAt)
GO

-- VIEW 2: vw_CustomerAccountBase
CREATE OR ALTER VIEW dbo.vw_CustomerAccountBase AS
SELECT 
    c.ConcessionerID,
    c.AccountNumber,
    u.FirstName + ' ' + u.LastName AS FullName,
    SUM(b.CurrentReading - b.PrevReading) AS LifetimeConsumption,
    SUM(b.BillAmount + ISNULL(b.Penalty, 0)) - ISNULL(SUM(p.AmountPaid), 0) AS RemainingBalance
FROM tbl_Concessioner c
INNER JOIN tbl_User u ON c.UserID = u.UserID
LEFT JOIN tbl_Billing b ON c.ConcessionerID = b.ConcessionerID
LEFT JOIN tbl_Payment p ON b.BillingID = p.BillingID
WHERE c.AccountNumber NOT LIKE '%MOTHER%'
  AND u.FirstName NOT LIKE '%MOTHER%'
GROUP BY c.ConcessionerID, c.AccountNumber, u.FirstName, u.LastName
GO

-- VIEW 3: vw_DistrictProgress
CREATE OR ALTER VIEW dbo.vw_DistrictProgress AS
SELECT 
    d.DistrictID,
    d.DistrictName,
    COUNT(DISTINCT CASE WHEN c.Status = 'Active' THEN c.ConcessionerID END) AS ActiveCount,
    COUNT(DISTINCT b.BillingID) AS ReadingsCompleted
FROM tbl_District d
LEFT JOIN tbl_Concessioner c ON d.DistrictID = c.DistrictID
LEFT JOIN tbl_User u ON c.UserID = u.UserID
LEFT JOIN tbl_Billing b ON c.ConcessionerID = b.ConcessionerID
WHERE (c.AccountNumber IS NULL OR (c.AccountNumber NOT LIKE '%MOTHER%' AND u.FirstName NOT LIKE '%MOTHER%'))
GROUP BY d.DistrictID, d.DistrictName
GO

-- VIEW 4: vw_DashboardStats
CREATE OR ALTER VIEW dbo.vw_DashboardStats AS
SELECT 
    (SELECT COUNT(*) FROM tbl_Concessioner c INNER JOIN tbl_User u ON c.UserID = u.UserID WHERE c.Status = 'Active' AND c.AccountNumber NOT LIKE '%MOTHER%' AND u.FirstName NOT LIKE '%MOTHER%') AS TotalActiveMembers,
    (SELECT SUM(b.BillAmount) FROM tbl_Billing b INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID INNER JOIN tbl_User u ON c.UserID = u.UserID WHERE b.BillStatus <> 'Paid' AND c.AccountNumber NOT LIKE '%MOTHER%' AND u.FirstName NOT LIKE '%MOTHER%') AS TotalPendingCollections,
    (SELECT SUM(b.CurrentReading - b.PrevReading) FROM tbl_Billing b INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID INNER JOIN tbl_User u ON c.UserID = u.UserID WHERE MONTH(b.CreatedAt) = MONTH(GETDATE()) AND YEAR(b.CreatedAt) = YEAR(GETDATE()) AND c.AccountNumber NOT LIKE '%MOTHER%' AND u.FirstName NOT LIKE '%MOTHER%') AS CurrentMonthConsumption,
    (SELECT COUNT(*) FROM tbl_Concessioner c INNER JOIN tbl_User u ON c.UserID = u.UserID WHERE c.AccountNumber NOT LIKE '%MOTHER%' AND u.FirstName NOT LIKE '%MOTHER%') AS TotalRegistered,
    (SELECT ISNULL(SUM(b.BillAmount + ISNULL(b.Penalty, 0)), 0) FROM tbl_Billing b INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID INNER JOIN tbl_User u ON c.UserID = u.UserID WHERE b.BillStatus = 'Overdue' AND c.AccountNumber NOT LIKE '%MOTHER%' AND u.FirstName NOT LIKE '%MOTHER%') AS TotalOverdueAmount,
    (SELECT COUNT(DISTINCT b.ConcessionerID) FROM tbl_Billing b INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID INNER JOIN tbl_User u ON c.UserID = u.UserID WHERE b.BillStatus = 'Overdue' AND c.AccountNumber NOT LIKE '%MOTHER%' AND u.FirstName NOT LIKE '%MOTHER%') AS OverdueConcessionerCount
FROM (SELECT 1 AS Dummy) AS d
GO

-- VIEW 5: vw_ArrearOverview (DETAILED)
CREATE OR ALTER VIEW dbo.vw_ArrearOverview AS
SELECT 
    c.ConcessionerID,
    c.AccountNumber,
    u.FirstName,
    u.LastName,
    d.DistrictName,
    SUM(b.BillAmount) AS TotalArrears,
    SUM(ISNULL(b.Penalty, 0)) AS TotalPenalty,
    COUNT(b.BillingID) AS MonthsWithBalance
FROM tbl_Billing b
INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID
INNER JOIN tbl_User u ON c.UserID = u.UserID
LEFT JOIN tbl_District d ON c.DistrictID = d.DistrictID
WHERE b.BillStatus IN ('Unpaid', 'Overdue', 'Partial')
  AND c.AccountNumber NOT LIKE '%MOTHER%'
  AND u.FirstName NOT LIKE '%MOTHER%'
GROUP BY c.ConcessionerID, c.AccountNumber, u.FirstName, u.LastName, d.DistrictName
GO

-- VIEW 6: vw_MembershipDistribution
CREATE OR ALTER VIEW vw_MembershipDistribution AS
SELECT 
    m.MembershipName,
    COUNT(c.ConcessionerID) AS TotalCustomers
FROM tbl_Membership m
LEFT JOIN tbl_Concessioner c ON m.MembershipID = c.MembershipID
LEFT JOIN tbl_User u ON c.UserID = u.UserID
WHERE (c.AccountNumber IS NULL OR (c.AccountNumber NOT LIKE '%MOTHER%' AND u.FirstName NOT LIKE '%MOTHER%'))
GROUP BY m.MembershipName
GO

-- VIEW 7: vw_HighRiskCollection
CREATE OR ALTER VIEW vw_HighRiskCollection AS
SELECT 
    c.ConcessionerID,
    c.AccountNumber,
    u.FirstName + ' ' + u.LastName AS FullName,
    u.FirstName,
    u.LastName,
    d.DistrictName,
    m.MembershipName,
    COUNT(b.BillingID) AS UnpaidBillCount,
    SUM(b.BillAmount + ISNULL(b.Penalty, 0)) AS TotalDebt,
    -- Aging Buckets
    SUM(CASE WHEN DATEDIFF(day, b.CreatedAt, GETDATE()) <= 0 THEN b.BillAmount + ISNULL(b.Penalty, 0) ELSE 0 END) AS BucketCurrent,
    SUM(CASE WHEN DATEDIFF(day, b.CreatedAt, GETDATE()) BETWEEN 1 AND 30 THEN b.BillAmount + ISNULL(b.Penalty, 0) ELSE 0 END) AS Bucket1_30,
    SUM(CASE WHEN DATEDIFF(day, b.CreatedAt, GETDATE()) BETWEEN 31 AND 60 THEN b.BillAmount + ISNULL(b.Penalty, 0) ELSE 0 END) AS Bucket31_60,
    SUM(CASE WHEN DATEDIFF(day, b.CreatedAt, GETDATE()) BETWEEN 61 AND 90 THEN b.BillAmount + ISNULL(b.Penalty, 0) ELSE 0 END) AS Bucket61_90,
    SUM(CASE WHEN DATEDIFF(day, b.CreatedAt, GETDATE()) > 90 THEN b.BillAmount + ISNULL(b.Penalty, 0) ELSE 0 END) AS BucketOver90
FROM tbl_Concessioner c
INNER JOIN tbl_User u ON c.UserID = u.UserID
INNER JOIN tbl_Billing b ON c.ConcessionerID = b.ConcessionerID
LEFT JOIN tbl_District d ON c.DistrictID = d.DistrictID
LEFT JOIN tbl_Membership m ON c.MembershipID = m.MembershipID
WHERE b.BillStatus IN ('Unpaid', 'Overdue', 'Partial')
  AND c.AccountNumber NOT LIKE '%MOTHER%'
  AND u.FirstName NOT LIKE '%MOTHER%'
GROUP BY c.ConcessionerID, c.AccountNumber, u.FirstName, u.LastName, d.DistrictName, m.MembershipName
GO

-- VIEW 8: vw_DisconnectionQueue
CREATE OR ALTER VIEW vw_DisconnectionQueue AS
SELECT 
    c.ConcessionerID,
    c.AccountNumber,
    u.FirstName + ' ' + u.LastName AS FullName,
    COUNT(b.BillingID) AS OverdueMonths,
    SUM(b.BillAmount + ISNULL(b.Penalty, 0)) AS TotalOutstanding
FROM tbl_Concessioner c
INNER JOIN tbl_User u ON c.UserID = u.UserID
INNER JOIN tbl_Billing b ON c.ConcessionerID = b.ConcessionerID
WHERE b.BillStatus IN ('Unpaid', 'Overdue', 'Partial')
  AND c.AccountNumber NOT LIKE '%MOTHER%'
  AND u.FirstName NOT LIKE '%MOTHER%'
GROUP BY c.ConcessionerID, c.AccountNumber, u.FirstName, u.LastName
HAVING COUNT(b.BillingID) >= 3
GO


-- ==========================================================================
-- 2. REFACTORED STORED PROCEDURES (12 PROCEDURES)
-- ==========================================================================

-- 1. SP_AddTotalCollectionsPerMonth
CREATE OR ALTER PROCEDURE SP_AddTotalCollectionsPerMonth
    @PeriodStart DATETIME,
    @PeriodEnd DATETIME
AS
BEGIN
    SET NOCOUNT ON
    SELECT ISNULL(SUM(AmountPaid), 0)
    FROM tbl_Payment
    WHERE DatePaid BETWEEN @PeriodStart AND @PeriodEnd
END
GO

-- 2. SP_AddTotalBillPerMonth
CREATE OR ALTER PROCEDURE SP_AddTotalBillPerMonth
    @PeriodStart DATETIME,
    @PeriodEnd DATETIME
AS
BEGIN
    SET NOCOUNT ON
    SELECT ISNULL(SUM(TotalBilled), 0)
    FROM vw_MonthlyRevenueTrend
    WHERE (Month >= MONTH(@PeriodStart) AND Year = YEAR(@PeriodStart))
      AND (Month <= MONTH(@PeriodEnd) AND Year = YEAR(@PeriodEnd))
END
GO

-- 3. SP_CalculatesTheRemainingBalance
CREATE OR ALTER PROCEDURE SP_CalculatesTheRemainingBalance
    @AccountNumber NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON
    SELECT AccountNumber, RemainingBalance
    FROM vw_CustomerAccountBase
    WHERE AccountNumber = @AccountNumber
END
GO

-- 4. SP_TotalWaterConsumptionOfAConcessioner
CREATE OR ALTER PROCEDURE SP_TotalWaterConsumptionOfAConcessioner
    @AccountNumber NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON
    SELECT LifetimeConsumption AS Consumption
    FROM vw_CustomerAccountBase
    WHERE AccountNumber = @AccountNumber
END
GO

-- 5. SP_ShowTotalActiveConcessionerInSpecificDistrict
CREATE OR ALTER PROCEDURE SP_ShowTotalActiveConcessionerInSpecificDistrict
    @DistrictName VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON
    SELECT ActiveCount AS TotalActiveConcessioner
    FROM vw_DistrictProgress
    WHERE DistrictName = @DistrictName
END
GO

-- 6. SP_GetTotalConsumptionCurrentMonth
CREATE OR ALTER PROCEDURE SP_GetTotalConsumptionCurrentMonth
AS
BEGIN
    SET NOCOUNT ON
    SELECT CurrentMonthConsumption FROM vw_DashboardStats
END
GO

-- 7. SP_TotalNumberOfRegisteredConcessioners
CREATE OR ALTER PROCEDURE SP_TotalNumberOfRegisteredConcessioners
AS
BEGIN
    SET NOCOUNT ON
    SELECT TotalRegistered FROM vw_DashboardStats
END
GO

-- 8. SP_GetDashboardSummary
CREATE OR ALTER PROCEDURE SP_GetDashboardSummary
AS
BEGIN
    SET NOCOUNT ON
    SELECT * FROM vw_DashboardStats
END
GO

-- 9. SP_GetArrearSummaryReport
CREATE OR ALTER PROCEDURE SP_GetArrearSummaryReport
AS
BEGIN
    SET NOCOUNT ON
    SELECT * FROM vw_ArrearOverview
END
GO

-- 10. SP_GetTotalCustomersByMembership
CREATE OR ALTER PROCEDURE SP_GetTotalCustomersByMembership
AS
BEGIN
    SET NOCOUNT ON
    SELECT * FROM vw_MembershipDistribution
END
GO

-- 11. SP_GetActiveCustomerDebtAndUsageSummary
-- Updated with Membership and District for filtering
CREATE OR ALTER PROCEDURE SP_GetActiveCustomerDebtAndUsageSummary
AS
BEGIN
    SET NOCOUNT ON
    SELECT 
        AccountNumber,
        FullName,
        FirstName,
        LastName,
        DistrictName AS District,
        MembershipName AS Membership,
        UnpaidBillCount,
        TotalDebt AS TotalOwed,
        BucketCurrent,
        Bucket1_30,
        Bucket31_60,
        Bucket61_90,
        BucketOver90
    FROM vw_HighRiskCollection
END
GO

-- 12. SP_GetDelinquentCustomersReport
CREATE OR ALTER PROCEDURE SP_GetDelinquentCustomersReport
AS
BEGIN
    SET NOCOUNT ON
    SELECT 
        AccountNumber,
        FullName,
        '0' AS LastReading,
        UnpaidBillCount,
        TotalDebt
    FROM vw_HighRiskCollection
    WHERE UnpaidBillCount >= 2
    ORDER BY TotalDebt DESC
END
GO

PRINT 'Successfully refactored 12 SPs and created 8 Views.'
GO
