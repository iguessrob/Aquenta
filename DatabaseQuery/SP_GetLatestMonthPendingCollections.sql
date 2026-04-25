-- ============================================================================
-- Latest Month Pending Collections
-- Purpose: Calculate total pending collections for the latest available billing month
-- Formula: SUM(BillAmount + Penalty) - SUM(AmountPaid)
-- ============================================================================

CREATE OR ALTER PROCEDURE SP_GetLatestMonthPendingCollections
AS
BEGIN
    SELECT
        ISNULL(SUM(b.BillAmount + ISNULL(b.Penalty, 0) - ISNULL(p.TotalAmountPaid, 0)), 0) AS LatestMonthPendingCollections
    FROM tbl_Billing b
    INNER JOIN tbl_Concessioner c ON c.ConcessionerID = b.ConcessionerID
    INNER JOIN tbl_User u ON u.UserID = c.UserID
    LEFT JOIN (
        SELECT
            BillingID,
            SUM(AmountPaid) AS TotalAmountPaid
        FROM tbl_Payment
        GROUP BY BillingID
    ) p ON b.BillingID = p.BillingID
    WHERE b.PeriodID = (
        SELECT TOP 1 b2.PeriodID
        FROM tbl_Billing b2
        INNER JOIN tbl_Period pe ON b2.PeriodID = pe.PeriodID
        ORDER BY pe.PeriodEnd DESC
    )
    AND UPPER(LTRIM(RTRIM(ISNULL(u.FirstName, '')))) NOT LIKE '%MOTHER METER%'
    AND UPPER(LTRIM(RTRIM(ISNULL(c.AccountNumber, '')))) NOT LIKE 'ACC-MOTHER%';
END
GO

-- ============================================================================
-- Total Monthly Account Receivable
-- Purpose: Sum of BillAmount + Penalty for latest available billing month
-- ============================================================================

CREATE OR ALTER PROCEDURE SP_GetTotalMonthlyAccountReceivable
AS
BEGIN
    SELECT
        ISNULL(SUM(b.BillAmount + ISNULL(b.Penalty, 0)), 0) AS TotalMonthlyAccountReceivable
    FROM tbl_Billing b
    WHERE b.PeriodID = (
        SELECT TOP 1 b2.PeriodID
        FROM tbl_Billing b2
        INNER JOIN tbl_Period p2 ON b2.PeriodID = p2.PeriodID
        ORDER BY p2.PeriodEnd DESC
    );
END
GO

-- ============================================================================
-- Total Monthly Collection
-- Purpose: Sum of AmountPaid for billings in latest available billing month
-- ============================================================================

CREATE OR ALTER PROCEDURE SP_GetTotalMonthlyCollection
AS
BEGIN
    SELECT
        ISNULL(SUM(p.AmountPaid), 0) AS TotalMonthlyCollection
    FROM tbl_Payment p
    INNER JOIN tbl_Billing b ON p.BillingID = b.BillingID
    WHERE b.PeriodID = (
        SELECT TOP 1 b2.PeriodID
        FROM tbl_Billing b2
        INNER JOIN tbl_Period p2 ON b2.PeriodID = p2.PeriodID
        ORDER BY p2.PeriodEnd DESC
    );
END
GO

-- ============================================================================
-- Total Annual Account Receivable
-- Purpose: Sum of BillAmount + Penalty for latest available billing year
-- ============================================================================

CREATE OR ALTER PROCEDURE SP_GetTotalAnnualAccountReceivable
AS
BEGIN
    SELECT
        ISNULL(SUM(b.BillAmount + ISNULL(b.Penalty, 0)), 0) AS TotalAnnualAccountReceivable
    FROM tbl_Billing b
    INNER JOIN tbl_Period p ON b.PeriodID = p.PeriodID
    WHERE YEAR(p.PeriodEnd) = (
        SELECT TOP 1 YEAR(p2.PeriodEnd)
        FROM tbl_Billing b2
        INNER JOIN tbl_Period p2 ON b2.PeriodID = p2.PeriodID
        ORDER BY p2.PeriodEnd DESC
    );
END
GO
