-- ============================================================================
-- AQUENTA WATER MANAGEMENT SYSTEM - REPORTING VIEWS
-- ============================================================================
-- Purpose:
-- 1) Simplify complex report queries
-- 2) Reuse common logic
-- 3) Improve security by exposing controlled datasets
-- 4) Make maintenance easier via centralized query logic
-- 5) Ensure consistent results across advanced reports
-- ============================================================================

USE AquentaDB;
GO

-- ==========================================================================
-- [VIEW MARKER] vw_AdvancedReport_LatestBillingMonth
-- Function: Returns the latest billing month window from tbl_Billing.
-- Purpose: Provides a reusable date boundary for the latest-period report filter.
-- ==========================================================================
CREATE OR ALTER VIEW dbo.vw_AdvancedReport_LatestBillingMonth
AS
SELECT
    DATEADD(MONTH, DATEDIFF(MONTH, 0, MAX(b.CreatedAt)), 0) AS MonthStart,
    DATEADD(MONTH, DATEDIFF(MONTH, 0, MAX(b.CreatedAt)) + 1, 0) AS MonthEnd
FROM tbl_Billing b;
GO

-- ==========================================================================
-- [VIEW MARKER] vw_AdvancedReport_BillingConsumptionDetail
-- Function: Joins billing, concessioner, district, category, membership, and user data with computed consumption.
-- Purpose: Serves as the canonical detailed dataset for consumption-based advanced reports.
-- ==========================================================================
CREATE OR ALTER VIEW dbo.vw_AdvancedReport_BillingConsumptionDetail
AS
SELECT
    b.BillingID,
    b.ConcessionerID,
    b.UserID,
    b.PeriodID,
    b.CreatedAt,
    b.BillStatus,
    b.PrevReading,
    b.CurrentReading,
    (b.CurrentReading - b.PrevReading) AS Consumption,
    b.BillAmount,
    ISNULL(b.Penalty, 0) AS Penalty,
    c.AccountNumber,
    c.Address,
    c.ContactNumber,
    c.EmailAddress,
    c.Status AS ConcessionerStatus,
    c.CategoryID,
    c.MembershipID,
    c.DistrictID,
    d.DistrictName,
    cat.CategoryName,
    m.MembershipName,
    m.DiscountRate,
    u.Username,
    u.FirstName,
    u.LastName
FROM tbl_Billing b
INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID
LEFT JOIN tbl_District d ON c.DistrictID = d.DistrictID
LEFT JOIN tbl_Category cat ON c.CategoryID = cat.CategoryID
LEFT JOIN tbl_Membership m ON c.MembershipID = m.MembershipID
LEFT JOIN tbl_User u ON c.UserID = u.UserID;
GO

-- ==========================================================================
-- [VIEW MARKER] vw_AdvancedReport_BillingPaymentSummary
-- Function: Aggregates payment total and payment count for each billing record.
-- Purpose: Provides a single reusable payment summary source for billing reports.
-- ==========================================================================
CREATE OR ALTER VIEW dbo.vw_AdvancedReport_BillingPaymentSummary
AS
SELECT
    b.BillingID,
    ISNULL(SUM(p.AmountPaid), 0) AS TotalPaid,
    COUNT(p.PaymentID) AS PaymentCount
FROM tbl_Billing b
LEFT JOIN tbl_Payment p ON p.BillingID = b.BillingID
GROUP BY b.BillingID;
GO

-- ==========================================================================
-- [VIEW MARKER] vw_AdvancedReport_BillingReportBase
-- Function: Combines billing detail rows with payment summary and total bills per concessioner.
-- Purpose: Acts as the shared base for comprehensive billing and monthly revenue reports.
-- ==========================================================================
CREATE OR ALTER VIEW dbo.vw_AdvancedReport_BillingReportBase
AS
SELECT
    d.BillingID,
    d.ConcessionerID,
    d.UserID,
    d.PeriodID,
    d.CreatedAt,
    d.BillStatus,
    d.PrevReading,
    d.CurrentReading,
    d.Consumption,
    d.BillAmount,
    d.Penalty,
    d.AccountNumber,
    d.Address,
    d.ContactNumber,
    d.EmailAddress,
    d.ConcessionerStatus,
    d.CategoryID,
    d.MembershipID,
    d.DistrictID,
    d.DistrictName,
    d.CategoryName,
    d.MembershipName,
    d.DiscountRate,
    d.Username,
    d.FirstName,
    d.LastName,
    ISNULL(p.TotalPaid, 0) AS TotalPaid,
    ISNULL(p.PaymentCount, 0) AS PaymentCount,
    SUM(d.BillAmount) OVER (PARTITION BY d.ConcessionerID) AS TotalBillsByConcessioner
FROM dbo.vw_AdvancedReport_BillingConsumptionDetail d
LEFT JOIN dbo.vw_AdvancedReport_BillingPaymentSummary p ON p.BillingID = d.BillingID;
GO

-- ==========================================================================
-- [VIEW MARKER] vw_AdvancedReport_ConcessionerBillingSummary
-- Function: Aggregates billing totals, unpaid amounts, and consumption per concessioner.
-- Purpose: Reuses one standardized summary for customer debt and account-detail reports.
-- ==========================================================================
CREATE OR ALTER VIEW dbo.vw_AdvancedReport_ConcessionerBillingSummary
AS
SELECT
    d.ConcessionerID,
    COUNT(DISTINCT d.BillingID) AS TotalBillsGenerated,
    COUNT(DISTINCT CASE WHEN d.BillStatus = 'Paid' THEN d.BillingID END) AS PaidBills,
    COUNT(DISTINCT CASE WHEN d.BillStatus IN ('Unpaid', 'Overdue', 'Partial') THEN d.BillingID END) AS UnpaidBills,
    COUNT(DISTINCT CASE WHEN d.BillStatus IN ('Unpaid', 'Overdue', 'Partial') THEN d.BillingID END) AS UnpaidBillCount,
    SUM(CASE WHEN d.BillStatus IN ('Unpaid', 'Overdue', 'Partial') THEN d.BillAmount + d.Penalty ELSE 0 END) AS TotalOutstanding,
    SUM(d.Consumption) AS TotalWaterConsumed,
    MIN(d.CreatedAt) AS EarliestBillDate,
    MAX(d.CreatedAt) AS LatestBillDate,
    -- Aging Buckets
    SUM(CASE WHEN d.BillStatus IN ('Unpaid', 'Overdue', 'Partial') AND DATEDIFF(day, d.CreatedAt, GETDATE()) <= 0 THEN d.BillAmount + d.Penalty ELSE 0 END) AS BucketCurrent,
    SUM(CASE WHEN d.BillStatus IN ('Unpaid', 'Overdue', 'Partial') AND DATEDIFF(day, d.CreatedAt, GETDATE()) BETWEEN 1 AND 30 THEN d.BillAmount + d.Penalty ELSE 0 END) AS Bucket1_30,
    SUM(CASE WHEN d.BillStatus IN ('Unpaid', 'Overdue', 'Partial') AND DATEDIFF(day, d.CreatedAt, GETDATE()) BETWEEN 31 AND 60 THEN d.BillAmount + d.Penalty ELSE 0 END) AS Bucket31_60,
    SUM(CASE WHEN d.BillStatus IN ('Unpaid', 'Overdue', 'Partial') AND DATEDIFF(day, d.CreatedAt, GETDATE()) BETWEEN 61 AND 90 THEN d.BillAmount + d.Penalty ELSE 0 END) AS Bucket61_90,
    SUM(CASE WHEN d.BillStatus IN ('Unpaid', 'Overdue', 'Partial') AND DATEDIFF(day, d.CreatedAt, GETDATE()) > 90 THEN d.BillAmount + d.Penalty ELSE 0 END) AS BucketOver90
FROM dbo.vw_AdvancedReport_BillingConsumptionDetail d
GROUP BY d.ConcessionerID;
GO

-- ==========================================================================
-- [VIEW MARKER] vw_AdvancedReport_DelinquentCustomerDetail
-- Function: Filters the detailed billing dataset to delinquent customers only.
-- Purpose: Supplies a clean, reusable source for the delinquent customer report.
-- ==========================================================================
CREATE OR ALTER VIEW dbo.vw_AdvancedReport_DelinquentCustomerDetail
AS
SELECT
    d.BillingID,
    d.ConcessionerID,
    d.FirstName,
    d.LastName,
    d.AccountNumber,
    d.Address,
    d.ContactNumber,
    d.DistrictName,
    d.ConcessionerStatus,
    d.BillStatus,
    d.BillAmount,
    d.Penalty,
    d.CreatedAt,
    d.CurrentReading,
    s.UnpaidBillCount
FROM dbo.vw_AdvancedReport_BillingConsumptionDetail d
LEFT JOIN dbo.vw_AdvancedReport_ConcessionerBillingSummary s ON d.ConcessionerID = s.ConcessionerID
WHERE d.BillStatus IN ('Unpaid', 'Overdue', 'Partial')
  AND (
    d.ConcessionerStatus = 'Delinquent' 
    OR d.BillStatus = 'Overdue'
    OR ISNULL(s.UnpaidBillCount, 0) >= 2
  );
GO

-- ==========================================================================
-- [VIEW MARKER] vw_AdvancedReport_PaymentCollectionDetail
-- Function: Joins payment records to billing and collector information.
-- Purpose: Gives collection-performance reports a single trusted source of payment activity.
-- ==========================================================================
CREATE OR ALTER VIEW dbo.vw_AdvancedReport_PaymentCollectionDetail
AS
SELECT
    p.PaymentID,
    p.BillingID,
    p.AmountPaid,
    p.DatePaid,
    b.UserID,
    u.FirstName + ' ' + u.LastName AS CollectorName,
    b.BillStatus
FROM tbl_Payment p
INNER JOIN tbl_Billing b ON p.BillingID = b.BillingID
INNER JOIN tbl_User u ON b.UserID = u.UserID;
GO

PRINT 'All reporting views created/updated successfully!';
GO
