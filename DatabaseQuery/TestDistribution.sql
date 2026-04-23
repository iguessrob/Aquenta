-- ============================================================================
-- TEST DATA: Arrears-First Payment Distribution
-- Run this in SSMS against AquentaDB
-- ============================================================================
USE AquentaDB;
GO

-- Step 1: Pick an existing concessioner (first active one)
DECLARE @TestConcessionerID INT;
SELECT TOP 1 @TestConcessionerID = ConcessionerID
FROM tbl_Concessioner WHERE Status = 'Active';

PRINT 'Using ConcessionerID: ' + CAST(@TestConcessionerID AS NVARCHAR(10));

-- Step 2: Pick an existing admin user
DECLARE @TestUserID INT;
SELECT TOP 1 @TestUserID = UserID FROM tbl_User;

-- Step 3: Create 3 test periods (Jan, Feb, Mar 2026)
DECLARE @Period1 INT, @Period2 INT, @Period3 INT;

-- Check if periods already exist, if not insert them
IF NOT EXISTS (SELECT 1 FROM tbl_Period WHERE PeriodStart = '2026-01-01' AND PeriodEnd = '2026-01-31')
	INSERT INTO tbl_Period (PeriodStart, PeriodEnd) VALUES ('2026-01-01', '2026-01-31');
SELECT @Period1 = PeriodID FROM tbl_Period WHERE PeriodStart = '2026-01-01' AND PeriodEnd = '2026-01-31';

IF NOT EXISTS (SELECT 1 FROM tbl_Period WHERE PeriodStart = '2026-02-01' AND PeriodEnd = '2026-02-28')
	INSERT INTO tbl_Period (PeriodStart, PeriodEnd) VALUES ('2026-02-01', '2026-02-28');
SELECT @Period2 = PeriodID FROM tbl_Period WHERE PeriodStart = '2026-02-01' AND PeriodEnd = '2026-02-28';

IF NOT EXISTS (SELECT 1 FROM tbl_Period WHERE PeriodStart = '2026-03-01' AND PeriodEnd = '2026-03-31')
	INSERT INTO tbl_Period (PeriodStart, PeriodEnd) VALUES ('2026-03-01', '2026-03-31');
SELECT @Period3 = PeriodID FROM tbl_Period WHERE PeriodStart = '2026-03-01' AND PeriodEnd = '2026-03-31';

-- Step 4: Insert 3 unpaid billings with different amounts
DECLARE @Billing1 INT, @Billing2 INT, @Billing3 INT;

INSERT INTO tbl_Billing (ConcessionerID, UserID, PeriodID, PrevReading, CurrentReading, BillAmount, Penalty, BillStatus, CreatedAt)
VALUES (@TestConcessionerID, @TestUserID, @Period1, 100, 120, 500.00, 0.00, 'Unpaid', '2026-01-15');
SET @Billing1 = SCOPE_IDENTITY();

INSERT INTO tbl_Billing (ConcessionerID, UserID, PeriodID, PrevReading, CurrentReading, BillAmount, Penalty, BillStatus, CreatedAt)
VALUES (@TestConcessionerID, @TestUserID, @Period2, 120, 145, 300.00, 50.00, 'Unpaid', '2026-02-15');
SET @Billing2 = SCOPE_IDENTITY();

INSERT INTO tbl_Billing (ConcessionerID, UserID, PeriodID, PrevReading, CurrentReading, BillAmount, Penalty, BillStatus, CreatedAt)
VALUES (@TestConcessionerID, @TestUserID, @Period3, 145, 170, 400.00, 0.00, 'Unpaid', '2026-03-15');
SET @Billing3 = SCOPE_IDENTITY();

-- Step 5: Insert payment records with AmountPaid = 0
INSERT INTO tbl_Payment (BillingID, AmountPaid, DatePaid) VALUES (@Billing1, 0, GETDATE());
INSERT INTO tbl_Payment (BillingID, AmountPaid, DatePaid) VALUES (@Billing2, 0, GETDATE());
INSERT INTO tbl_Payment (BillingID, AmountPaid, DatePaid) VALUES (@Billing3, 0, GETDATE());

-- Step 6: Show what was created
PRINT '--------------------------------------------';
PRINT 'TEST DATA CREATED:';
PRINT '--------------------------------------------';
PRINT 'Billing 1 (Jan): BillAmount=500, Penalty=0,   Total=500';
PRINT 'Billing 2 (Feb): BillAmount=300, Penalty=50,  Total=350';
PRINT 'Billing 3 (Mar): BillAmount=400, Penalty=0,   Total=400';
PRINT '--------------------------------------------';
PRINT 'Grand Total Outstanding: 1250.00';
PRINT '';
PRINT 'TEST: Enter 800 as Amount Paid on any of these rows.';
PRINT 'EXPECTED: Jan=500 (Paid), Feb=300 (Partial 300/350), Mar=0 (Unpaid)';
PRINT '';
PRINT 'ConcessionerID = ' + CAST(@TestConcessionerID AS NVARCHAR(10));

SELECT c.AccountNumber, u.FirstName, u.LastName,
       b.BillingID, b.BillAmount, b.Penalty, b.BillStatus,
       p2.PeriodStart, p2.PeriodEnd,
       pay.PaymentID, pay.AmountPaid
FROM tbl_Billing b
INNER JOIN tbl_Concessioner c ON b.ConcessionerID = c.ConcessionerID
INNER JOIN tbl_User u ON c.UserID = u.UserID
INNER JOIN tbl_Period p2 ON b.PeriodID = p2.PeriodID
LEFT JOIN tbl_Payment pay ON b.BillingID = pay.BillingID
WHERE b.BillingID IN (@Billing1, @Billing2, @Billing3)
ORDER BY p2.PeriodEnd ASC;
