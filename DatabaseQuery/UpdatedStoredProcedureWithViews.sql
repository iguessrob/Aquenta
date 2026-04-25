-- View 1: Concessioner Status Summary
CREATE VIEW view_concessioner_status_summary AS
SELECT 
    Status,
    COUNT(ConcessionerID) AS TotalConcessioners
FROM tbl_Concessioner
GROUP BY Status;



-- Updated SP
ALTER PROCEDURE SP_ShowTotalActiveConcessioners
    @Status VARCHAR(50)
AS
BEGIN
    SELECT TotalConcessioners AS TotalActiveConcessioners
    FROM view_concessioner_status_summary
    WHERE Status = @Status;
END




-- View 2: Billing Water Consumption Base 
CREATE VIEW view_billing_water_consumption AS
SELECT 
    BillingID,
    CreatedAt,
    (CurrentReading - PrevReading) AS WaterConsumed
FROM tbl_Billing b
INNER JOIN tbl_Concessioner c ON c.ConcessionerID = b.ConcessionerID
INNER JOIN tbl_User u ON u.UserID = c.UserID
WHERE UPPER(LTRIM(RTRIM(ISNULL(u.FirstName, '')))) <> 'MOTHER METER';



-- Updated SP
ALTER PROCEDURE SP_GetMonthlyWaterConsumption
    @StartDate DATETIME,
    @EndDate DATETIME
AS
BEGIN
    SELECT SUM(WaterConsumed) AS WaterConsumed
    FROM view_billing_water_consumption
    WHERE CreatedAt >= @StartDate AND CreatedAt < @EndDate;
END




-- View 3: Pending Bills 
CREATE VIEW view_pending_bills AS
SELECT 
    BillingID,
    BillAmount
FROM tbl_Billing b
INNER JOIN tbl_Concessioner c ON c.ConcessionerID = b.ConcessionerID
INNER JOIN tbl_User u ON u.UserID = c.UserID
WHERE b.BillStatus <> 'Paid'
    AND UPPER(LTRIM(RTRIM(ISNULL(u.FirstName, '')))) <> 'MOTHER METER';



-- Updated SP
ALTER PROCEDURE SP_ShowSumAmountofPendingConcessioner
AS
BEGIN
    SELECT SUM(BillAmount) AS PendingCollections
    FROM view_pending_bills;
END

-- View 4: Total Concessioners Base 
CREATE VIEW view_concessioners_all AS
SELECT ConcessionerID
FROM tbl_Concessioner;



-- Updated SP
ALTER PROCEDURE SP_GetTotalConcessioners
AS
BEGIN
    SELECT COUNT(ConcessionerID) AS TotalConcessioners
    FROM view_concessioners_all;
END


-- View 5: Billing Summary by Period 
CREATE VIEW view_billing_summary AS
SELECT 
    PeriodID,
    BillAmount,
    Penalty,
    BillingID
FROM tbl_Billing;



-- Updated SP
ALTER PROCEDURE SP_GetTotalBillingByPeriod
    @PeriodID INT
AS
BEGIN
    SELECT
        SUM(BillAmount) AS TotalBillingAmount,
        COUNT(BillingID) AS TotalBills,
        SUM(Penalty) AS TotalPenalty
    FROM view_billing_summary
    WHERE PeriodID = @PeriodID;
END



-- View 6: Payment Records Base 
CREATE VIEW view_payment_records AS
SELECT 
    PaymentID,
    AmountPaid,
    DatePaid
FROM tbl_Payment;



-- Updated SP 
ALTER PROCEDURE SP_GetTotalPaymentCollections
    @StartDate DATETIME,
    @EndDate DATETIME
AS
BEGIN
    SELECT
        SUM(AmountPaid) AS TotalPaymentCollected,
        COUNT(PaymentID) AS TotalPayments
    FROM view_payment_records
    WHERE DatePaid >= @StartDate AND DatePaid < @EndDate;
END




-- View 7: Unpaid Bills Base 
CREATE VIEW view_unpaid_bills AS
SELECT 
    BillingID,
    BillAmount,
    Penalty
FROM tbl_Billing
WHERE BillStatus IN ('Unpaid', 'Overdue');



-- Updated SP
ALTER PROCEDURE SP_GetUnpaidBillsSummary
AS
BEGIN
    SELECT
        COUNT(BillingID) AS UnpaidBillsCount,
        SUM(BillAmount + Penalty) AS TotalUnpaidAmount
    FROM view_unpaid_bills;
END

-- View 8: Overdue Bills Base 
CREATE VIEW view_overdue_bills AS
SELECT 
    BillingID,
    BillAmount,
    Penalty
FROM tbl_Billing
WHERE BillStatus = 'Overdue';



-- Updated SP
ALTER PROCEDURE SP_GetOverdueBillsSummary
AS
BEGIN
    SELECT
        COUNT(BillingID) AS OverdueBillsCount,
        SUM(BillAmount + Penalty) AS TotalOverdueAmount
    FROM view_overdue_bills;
END

