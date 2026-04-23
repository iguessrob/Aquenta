-- ============================================================================
-- AQUENTA WATER MANAGEMENT SYSTEM - UPDATED ADVANCED REPORT PROCEDURES
-- ============================================================================
-- Uses views from DatabaseQuery/views.sql
-- ============================================================================

USE AquentaDB;
GO

-- District Water Consumption Summary by Latest Period
CREATE OR ALTER PROCEDURE SP_GetDistrictConsumptionSummary
AS
BEGIN
    SELECT
        d.DistrictID,
        d.DistrictName,
        COUNT(DISTINCT d.ConcessionerID) AS TotalCustomers,
        SUM(d.Consumption) AS TotalConsumption,
        AVG(CAST(d.Consumption AS DECIMAL(18, 2))) AS AvgConsumption
    FROM dbo.vw_AdvancedReport_BillingConsumptionDetail d
    CROSS JOIN dbo.vw_AdvancedReport_LatestBillingMonth lm
    WHERE d.CreatedAt >= lm.MonthStart
      AND d.CreatedAt < lm.MonthEnd
    GROUP BY d.DistrictID, d.DistrictName
    HAVING SUM(d.Consumption) > 0
    ORDER BY TotalConsumption DESC;
END
GO

-- Comprehensive Billing Report with Payment Details
CREATE OR ALTER PROCEDURE SP_GetBillingWithPaymentSummary
AS
BEGIN
    SELECT
        r.AccountNumber,
        r.Address,
        r.CategoryName,
        r.FirstName,
        r.LastName,
        r.BillingID,
        r.BillAmount,
        r.Penalty,
        r.BillStatus,
        r.CreatedAt,
        r.TotalPaid,
        r.Consumption,
        r.PaymentCount,
        r.TotalBillsByConcessioner AS TotalBills
    FROM dbo.vw_AdvancedReport_BillingReportBase r
    ORDER BY r.BillingID DESC;
END
GO

-- Active Customers with Debt and Water Usage Summary
CREATE OR ALTER PROCEDURE SP_GetActiveCustomerDebtAndUsageSummary
AS
BEGIN
    SELECT
        u.FirstName,
        u.LastName,
        c.AccountNumber,
        d.DistrictName AS District,
        m.MembershipName AS Membership,
        ISNULL(a.TotalOutstanding, 0) AS TotalOwed,
        ISNULL(a.TotalWaterConsumed, 0) AS TotalWaterUsed,
        ISNULL(a.BucketCurrent, 0) AS BucketCurrent,
        ISNULL(a.Bucket1_30, 0) AS Bucket1_30,
        ISNULL(a.Bucket31_60, 0) AS Bucket31_60,
        ISNULL(a.Bucket61_90, 0) AS Bucket61_90,
        ISNULL(a.BucketOver90, 0) AS BucketOver90
    FROM tbl_Concessioner c
    INNER JOIN tbl_User u ON c.UserID = u.UserID
    INNER JOIN tbl_District d ON c.DistrictID = d.DistrictID
    INNER JOIN tbl_Membership m ON c.MembershipID = m.MembershipID
    LEFT JOIN dbo.vw_AdvancedReport_ConcessionerBillingSummary a ON c.ConcessionerID = a.ConcessionerID
    ORDER BY ISNULL(a.TotalWaterConsumed, 0) DESC;
END
GO

-- Delinquent Customers Report
CREATE OR ALTER PROCEDURE SP_GetDelinquentCustomersReport
AS
BEGIN
    SELECT
        d.FirstName + ' ' + d.LastName AS FullName,
        d.AccountNumber,
        d.Address,
        d.ContactNumber,
        d.ConcessionerStatus AS Status,
        d.DistrictName,
        COUNT(DISTINCT d.BillingID) AS UnpaidBillCount,
        SUM(d.BillAmount + d.Penalty) AS TotalDebt,
        MIN(d.CreatedAt) AS EarliestBillDate,
        MAX(d.CreatedAt) AS LatestBillDate,
        MAX(d.CurrentReading) AS LastReading
    FROM dbo.vw_AdvancedReport_DelinquentCustomerDetail d
    GROUP BY
        d.FirstName,
        d.LastName,
        d.AccountNumber,
        d.Address,
        d.ContactNumber,
        d.ConcessionerStatus,
        d.DistrictName
    ORDER BY TotalDebt DESC;
END
GO

-- Collection Performance Summary by User (Admin/Collector)
CREATE OR ALTER PROCEDURE SP_GetCollectionPerformanceSummary
    @StartDate DATETIME,
    @EndDate DATETIME
AS
BEGIN
    SELECT
        p.UserID,
        p.CollectorName,
        COUNT(DISTINCT p.PaymentID) AS PaymentCount,
        SUM(p.AmountPaid) AS TotalAmountCollected,
        COUNT(DISTINCT CASE WHEN p.BillStatus = 'Paid' THEN p.BillingID END) AS BillsProcessed
    FROM dbo.vw_AdvancedReport_PaymentCollectionDetail p
    WHERE p.DatePaid >= @StartDate
      AND p.DatePaid < @EndDate
    GROUP BY p.UserID, p.CollectorName
    ORDER BY TotalAmountCollected DESC;
END
GO

-- Monthly Revenue Report
CREATE OR ALTER PROCEDURE SP_GetMonthlyRevenueReport
    @Year INT
AS
BEGIN
    SELECT
        DATEFROMPARTS(@Year, MONTH(r.CreatedAt), 1) AS [Month],
        COUNT(DISTINCT r.BillingID) AS TotalBillings,
        SUM(r.BillAmount) AS TotalBillAmount,
        SUM(r.Penalty) AS TotalPenalty,
        SUM(r.TotalPaid) AS TotalPaymentCollected,
        SUM(r.BillAmount) - SUM(r.TotalPaid) AS OutstandingAmount
    FROM dbo.vw_AdvancedReport_BillingReportBase r
    WHERE YEAR(r.CreatedAt) = @Year
    GROUP BY MONTH(r.CreatedAt)
    ORDER BY MONTH(r.CreatedAt);
END
GO

-- Monthly Consumption Report
CREATE OR ALTER PROCEDURE SP_GetMonthlyConsumptionReport
    @Year INT
AS
BEGIN
    SELECT
        MONTH(d.CreatedAt) AS MonthIndex,
        SUM(d.Consumption) AS TotalConsumption
    FROM dbo.vw_AdvancedReport_BillingConsumptionDetail d
    WHERE YEAR(d.CreatedAt) = @Year
    GROUP BY MONTH(d.CreatedAt)
    ORDER BY MonthIndex;
END
GO

-- Customer Account Status Detail Report
CREATE OR ALTER PROCEDURE SP_GetCustomerAccountDetailReport
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
        ISNULL(a.TotalBillsGenerated, 0) AS TotalBillsGenerated,
        ISNULL(a.PaidBills, 0) AS PaidBills,
        ISNULL(a.UnpaidBills, 0) AS UnpaidBills,
        ISNULL(a.TotalOutstanding, 0) AS TotalOutstanding,
        ISNULL(a.TotalWaterConsumed, 0) AS TotalWaterConsumed
    FROM tbl_Concessioner c
    INNER JOIN tbl_User u ON c.UserID = u.UserID
    INNER JOIN tbl_District d ON c.DistrictID = d.DistrictID
    INNER JOIN tbl_Category cat ON c.CategoryID = cat.CategoryID
    INNER JOIN tbl_Membership m ON c.MembershipID = m.MembershipID
    LEFT JOIN dbo.vw_AdvancedReport_ConcessionerBillingSummary a ON c.ConcessionerID = a.ConcessionerID
    WHERE c.ConcessionerID = @ConcessionerID;
END
GO

PRINT 'Updated advanced report stored procedures created/updated successfully!';
GO
