-- ============================================================================
-- AQUENTA WATER MANAGEMENT SYSTEM - STORED PROCEDURES GUIDE
-- ============================================================================
-- Purpose: Documentation for integrating SQL Server SPs with AquentaLibrary backend
-- Date: March 24, 2026
-- ============================================================================

## OVERVIEW

This guide explains all 80+ Stored Procedures created for the Aquenta Water Management System.
Each SP is production-ready and can be copy-pasted directly into SQL Server Management Studio.

---

## NAMING CONVENTION

All SPs follow this pattern:
- **SP_GetAll{TableName}** - Retrieve all records from a table
- **SP_GetById{TableName}** - Retrieve a single record by ID
- **SP_Get{TableName}ByStatus/ByDistrictId/etc** - Retrieve records with conditions
- **SP_Insert{TableName}** - Insert new record
- **SP_Update{TableName}** - Update existing record
- **SP_Delete{TableName}** - Delete record
- **SP_{ActionName}** - Aggregate/Report SPs (e.g., SP_ShowTotalActiveConcessioners)

---

## TABLE 1: DISTRICT STORED PROCEDURES

### SP_GetAllDistrict
**Purpose:** Retrieve all districts
**Parameters:** None
**Returns:** DistrictID, DistrictName
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllDistrict";
var districts = connection.Query<DistrictModel>(sql).ToList();
```

### SP_GetDistrictById
**Purpose:** Retrieve single district by ID
**Parameters:** @DistrictID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetDistrictById @DistrictID";
var district = connection.QuerySingleOrDefault<DistrictModel>(sql, new { DistrictID = id });
```

### SP_InsertDistrict
**Purpose:** Create new district
**Parameters:** @DistrictName NVARCHAR(50)
**Returns:** DistrictID (new identity)
**Backend Usage:**
```csharp
var sql = "EXEC SP_InsertDistrict @DistrictName";
var newDistrictId = connection.QuerySingle<int>(sql, new { DistrictName = model.DistrictName });
```

### SP_UpdateDistrict
**Purpose:** Update district
**Parameters:** @DistrictID INT, @DistrictName NVARCHAR(50)
**Returns:** RowsAffected
**Backend Usage:**
```csharp
var sql = "EXEC SP_UpdateDistrict @DistrictID, @DistrictName";
var rowsAffected = connection.Execute(sql, new { DistrictID = id, DistrictName = model.DistrictName });
```

### SP_DeleteDistrict
**Purpose:** Delete district
**Parameters:** @DistrictID INT
**Returns:** RowsAffected
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeleteDistrict @DistrictID";
var rowsAffected = connection.Execute(sql, new { DistrictID = id });
```

---

## TABLE 2: MEMBERSHIP STORED PROCEDURES

### SP_GetAllMembership
**Purpose:** Retrieve all membership types
**Parameters:** None
**Returns:** MembershipID, MembershipName, DiscountRate
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllMembership";
var memberships = connection.Query<MembershipModel>(sql).ToList();
```

### SP_GetMembershipById
**Purpose:** Retrieve single membership
**Parameters:** @MembershipID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetMembershipById @MembershipID";
var membership = connection.QuerySingleOrDefault<MembershipModel>(sql, new { MembershipID = id });
```

### SP_InsertMembership
**Purpose:** Create new membership type
**Parameters:** @MembershipName NVARCHAR(20), @DiscountRate DECIMAL(5,2)
**Returns:** MembershipID
**Backend Usage:**
```csharp
var sql = "EXEC SP_InsertMembership @MembershipName, @DiscountRate";
var newMembershipId = connection.QuerySingle<int>(sql, new { 
    MembershipName = model.MembershipName, 
    DiscountRate = model.DiscountRate 
});
```

### SP_UpdateMembership
**Purpose:** Update membership
**Parameters:** @MembershipID INT, @MembershipName NVARCHAR(20), @DiscountRate DECIMAL(5,2)
**Backend Usage:**
```csharp
var sql = "EXEC SP_UpdateMembership @MembershipID, @MembershipName, @DiscountRate";
var rowsAffected = connection.Execute(sql, new { 
    MembershipID = id, 
    MembershipName = model.MembershipName, 
    DiscountRate = model.DiscountRate 
});
```

### SP_DeleteMembership
**Purpose:** Delete membership type
**Parameters:** @MembershipID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeleteMembership @MembershipID";
var rowsAffected = connection.Execute(sql, new { MembershipID = id });
```

---

## TABLE 3: CATEGORY STORED PROCEDURES

### SP_GetAllCategory
**Purpose:** Retrieve all categories (Residential, Commercial)
**Parameters:** None
**Returns:** CategoryID, CategoryName
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllCategory";
var categories = connection.Query<CategoryModel>(sql).ToList();
```

### SP_GetCategoryById
**Purpose:** Retrieve single category
**Parameters:** @CategoryID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetCategoryById @CategoryID";
var category = connection.QuerySingleOrDefault<CategoryModel>(sql, new { CategoryID = id });
```

### SP_InsertCategory
**Purpose:** Create new category
**Parameters:** @CategoryName NVARCHAR(20)
**Returns:** CategoryID
**Backend Usage:**
```csharp
var sql = "EXEC SP_InsertCategory @CategoryName";
var newCategoryId = connection.QuerySingle<int>(sql, new { CategoryName = model.CategoryName });
```

### SP_UpdateCategory
**Purpose:** Update category
**Parameters:** @CategoryID INT, @CategoryName NVARCHAR(20)
**Backend Usage:**
```csharp
var sql = "EXEC SP_UpdateCategory @CategoryID, @CategoryName";
var rowsAffected = connection.Execute(sql, new { CategoryID = id, CategoryName = model.CategoryName });
```

### SP_DeleteCategory
**Purpose:** Delete category
**Parameters:** @CategoryID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeleteCategory @CategoryID";
var rowsAffected = connection.Execute(sql, new { CategoryID = id });
```

---

## TABLE 4: TARIFF RATE STORED PROCEDURES

### SP_GetAllTariffRate
**Purpose:** Retrieve all tariff rates
**Parameters:** None
**Returns:** RateID, CategoryID, CubicMeter, Amount
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllTariffRate";
var tariffs = connection.Query<TariffsModel>(sql).ToList();
```

### SP_GetTariffRateById
**Purpose:** Retrieve single tariff rate
**Parameters:** @RateID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetTariffRateById @RateID";
var tariff = connection.QuerySingleOrDefault<TariffsModel>(sql, new { RateID = id });
```

### SP_GetTariffRateByCategoryId ⭐ IMPORTANT
**Purpose:** Retrieve all tariff rates for a specific category (Residential or Commercial)
**Parameters:** @CategoryID INT
**Returns:** All rates for that category ordered by CubicMeter
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetTariffRateByCategoryId @CategoryID";
var categoryRates = connection.Query<TariffsModel>(sql, new { CategoryID = categoryId }).ToList();
```
**Frontend Usage:**
```javascript
// This SP is perfect for populating tariffs UI by category
fetch(`/api/Tariffs/by-category/${categoryId}`)
  .then(res => res.json())
  .then(rates => displayTariffGrid(rates));
```

### SP_InsertTariffRate
**Purpose:** Create new tariff rate
**Parameters:** @CategoryID INT, @CubicMeter DECIMAL(5,2), @Amount DECIMAL(8,2)
**Returns:** RateID
**Backend Usage:**
```csharp
var sql = "EXEC SP_InsertTariffRate @CategoryID, @CubicMeter, @Amount";
var newRateId = connection.QuerySingle<int>(sql, new { 
    CategoryID = model.CategoryID, 
    CubicMeter = model.CubicMeter, 
    Amount = model.Amount 
});
```

### SP_UpdateTariffRate
**Purpose:** Update tariff rate
**Parameters:** @RateID INT, @CategoryID INT, @CubicMeter DECIMAL(5,2), @Amount DECIMAL(8,2)
**Backend Usage:**
```csharp
var sql = "EXEC SP_UpdateTariffRate @RateID, @CategoryID, @CubicMeter, @Amount";
var rowsAffected = connection.Execute(sql, new { 
    RateID = id, 
    CategoryID = model.CategoryID, 
    CubicMeter = model.CubicMeter, 
    Amount = model.Amount 
});
```

### SP_DeleteTariffRate
**Purpose:** Delete tariff rate
**Parameters:** @RateID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeleteTariffRate @RateID";
var rowsAffected = connection.Execute(sql, new { RateID = id });
```

---

## TABLE 5: USER STORED PROCEDURES

### SP_GetAllUser
**Purpose:** Retrieve all users
**Parameters:** None
**Returns:** UserID, Username, Pass, FirstName, LastName, UserRole, CreatedAt, IsDeleted
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllUser";
var users = connection.Query<UserModel>(sql).ToList();
```

### SP_GetUserById
**Purpose:** Retrieve single user by ID
**Parameters:** @UserID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetUserById @UserID";
var user = connection.QuerySingleOrDefault<UserModel>(sql, new { UserID = userId });
```

### SP_GetUserByUsername ⭐ IMPORTANT
**Purpose:** Retrieve user by username for LOGIN authentication
**Parameters:** @Username VARCHAR(50)
**Returns:** All user fields including password hash
**Backend Usage - LOGIN ENDPOINT:**
```csharp
var sql = "EXEC SP_GetUserByUsername @Username";
var user = connection.QuerySingleOrDefault<UserModel>(sql, new { Username = username });

if (user != null && user.Pass == password) {
    // Login successful
    return Ok(new { userId = user.UserID, username = user.Username });
}
else {
    return Unauthorized();
}
```

### SP_InsertUser
**Purpose:** Create new user
**Parameters:** @Username VARCHAR(50), @Pass VARCHAR(255), @FirstName VARCHAR(50), @LastName VARCHAR(50), @UserRole VARCHAR(50)
**Returns:** UserID
**Backend Usage:**
```csharp
var sql = "EXEC SP_InsertUser @Username, @Pass, @FirstName, @LastName, @UserRole";
var newUserId = connection.QuerySingle<int>(sql, new { 
    Username = model.Username, 
    Pass = model.Pass, 
    FirstName = model.FirstName, 
    LastName = model.LastName, 
    UserRole = model.UserRole 
});
```

### SP_UpdateUser
**Purpose:** Update user details
**Parameters:** @UserID INT, @Username VARCHAR(50), @Pass VARCHAR(255), @FirstName VARCHAR(50), @LastName VARCHAR(50), @UserRole VARCHAR(50)
**Backend Usage:**
```csharp
var sql = "EXEC SP_UpdateUser @UserID, @Username, @Pass, @FirstName, @LastName, @UserRole";
var rowsAffected = connection.Execute(sql, new { 
    UserID = userId, 
    Username = model.Username, 
    Pass = model.Pass, 
    FirstName = model.FirstName, 
    LastName = model.LastName, 
    UserRole = model.UserRole 
});
```

### SP_DeleteUser
**Purpose:** Soft delete user (marks IsDeleted = 1)
**Parameters:** @UserID INT
**Returns:** RowsAffected
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeleteUser @UserID";
var rowsAffected = connection.Execute(sql, new { UserID = userId });
```

### SP_DeleteUserPermanent
**Purpose:** Permanent delete from database
**Parameters:** @UserID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeleteUserPermanent @UserID";
var rowsAffected = connection.Execute(sql, new { UserID = userId });
```

---

## TABLE 6: CONCESSIONER STORED PROCEDURES

### SP_GetAllConcessioner
**Purpose:** Retrieve all concessioners (customers)
**Parameters:** None
**Returns:** All concessioner fields
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllConcessioner";
var concessioners = connection.Query<ConcessionerModel>(sql).ToList();
```

### SP_GetConcessionerById
**Purpose:** Retrieve single concessioner
**Parameters:** @ConcessionerID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetConcessionerById @ConcessionerID";
var concessioner = connection.QuerySingleOrDefault<ConcessionerModel>(sql, new { ConcessionerID = id });
```

### SP_GetConcessionerByStatus ⭐ IMPORTANT
**Purpose:** Retrieve concessioners filtered by status (Active, Inactive, Disconnected, Delinquent)
**Parameters:** @Status NVARCHAR(20)
**Returns:** All matching concessioners
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetConcessionerByStatus @Status";
var activeCustomers = connection.Query<ConcessionerModel>(sql, new { Status = "Active" }).ToList();
```

### SP_GetConcessionerByDistrictId
**Purpose:** Retrieve all concessioners in a specific district
**Parameters:** @DistrictID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetConcessionerByDistrictId @DistrictID";
var districtCustomers = connection.Query<ConcessionerModel>(sql, new { DistrictID = districtId }).ToList();
```

### SP_GetConcessionerByUserId
**Purpose:** Retrieve concessioners associated with a user (admin/collector)
**Parameters:** @UserID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetConcessionerByUserId @UserID";
var userConcessioners = connection.Query<ConcessionerModel>(sql, new { UserID = userId }).ToList();
```

### SP_InsertConcessioner
**Purpose:** Create new concessioner
**Parameters:** @UserID, @CategoryID, @MembershipID, @DistrictID, @AccountNumber, @AccountOrder, @MeterNumber, @Address, @ContactNumber, @EmailAddress, @Status
**Returns:** ConcessionerID
**Backend Usage:**
```csharp
var sql = @"EXEC SP_InsertConcessioner 
    @UserID, @CategoryID, @MembershipID, @DistrictID, @AccountNumber, @AccountOrder, 
    @MeterNumber, @Address, @ContactNumber, @EmailAddress, @Status";
var newConcessionerId = connection.QuerySingle<int>(sql, model);
```

### SP_UpdateConcessioner
**Purpose:** Update concessioner details
**Parameters:** All concessioner fields
**Backend Usage:**
```csharp
var sql = @"EXEC SP_UpdateConcessioner 
    @ConcessionerID, @UserID, @CategoryID, @MembershipID, @DistrictID, @AccountNumber, 
    @AccountOrder, @MeterNumber, @Address, @ContactNumber, @EmailAddress, @Status";
var rowsAffected = connection.Execute(sql, model);
```

### SP_DeleteConcessioner
**Purpose:** Delete concessioner record
**Parameters:** @ConcessionerID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeleteConcessioner @ConcessionerID";
var rowsAffected = connection.Execute(sql, new { ConcessionerID = id });
```

---

## TABLE 7: PERIOD STORED PROCEDURES

### SP_GetAllPeriod
**Purpose:** Retrieve all billing periods
**Parameters:** None
**Returns:** PeriodID, PeriodStart, PeriodEnd
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllPeriod";
var periods = connection.Query<PeriodModel>(sql).ToList();
```

### SP_GetPeriodById
**Purpose:** Retrieve single period
**Parameters:** @PeriodID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetPeriodById @PeriodID";
var period = connection.QuerySingleOrDefault<PeriodModel>(sql, new { PeriodID = id });
```

### SP_GetLatestPeriod ⭐ IMPORTANT
**Purpose:** Get the most recent billing period
**Parameters:** None
**Returns:** Latest PeriodID, PeriodStart, PeriodEnd
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetLatestPeriod";
var latestPeriod = connection.QuerySingleOrDefault<PeriodModel>(sql);
```

### SP_InsertPeriod
**Purpose:** Create new billing period
**Parameters:** @PeriodStart DATETIME, @PeriodEnd DATETIME
**Returns:** PeriodID
**Backend Usage:**
```csharp
var sql = "EXEC SP_InsertPeriod @PeriodStart, @PeriodEnd";
var newPeriodId = connection.QuerySingle<int>(sql, new { 
    PeriodStart = model.PeriodStart, 
    PeriodEnd = model.PeriodEnd 
});
```

### SP_UpdatePeriod
**Purpose:** Update period dates
**Parameters:** @PeriodID INT, @PeriodStart DATETIME, @PeriodEnd DATETIME
**Backend Usage:**
```csharp
var sql = "EXEC SP_UpdatePeriod @PeriodID, @PeriodStart, @PeriodEnd";
var rowsAffected = connection.Execute(sql, new { 
    PeriodID = id, 
    PeriodStart = model.PeriodStart, 
    PeriodEnd = model.PeriodEnd 
});
```

### SP_DeletePeriod
**Purpose:** Delete period
**Parameters:** @PeriodID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeletePeriod @PeriodID";
var rowsAffected = connection.Execute(sql, new { PeriodID = id });
```

---

## TABLE 8: BILLING STORED PROCEDURES

### SP_GetAllBilling
**Purpose:** Retrieve all bills
**Parameters:** None
**Returns:** All billing fields
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllBilling";
var bills = connection.Query<BillingModel>(sql).ToList();
```

### SP_GetBillingById
**Purpose:** Retrieve single bill
**Parameters:** @BillingID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetBillingById @BillingID";
var bill = connection.QuerySingleOrDefault<BillingModel>(sql, new { BillingID = id });
```

### SP_GetBillingByConcessionerId ⭐ IMPORTANT
**Purpose:** Get all bills for a specific customer
**Parameters:** @ConcessionerID INT
**Returns:** All bills ordered by newest first
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetBillingByConcessionerId @ConcessionerID";
var customerBills = connection.Query<BillingModel>(sql, new { ConcessionerID = concessionerId }).ToList();
```

### SP_GetBillingByStatus ⭐ IMPORTANT
**Purpose:** Get bills filtered by status (Paid, Unpaid, Overdue)
**Parameters:** @BillStatus NVARCHAR(50)
**Returns:** All matching bills
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetBillingByStatus @BillStatus";
var unpaidBills = connection.Query<BillingModel>(sql, new { BillStatus = "Unpaid" }).ToList();
```

### SP_InsertBilling
**Purpose:** Create new bill
**Parameters:** @ConcessionerID, @UserID, @PeriodID, @PrevReading, @CurrentReading, @BillAmount, @BillStatus, @Penalty (optional)
**Returns:** BillingID
**Backend Usage:**
```csharp
var sql = @"EXEC SP_InsertBilling 
    @ConcessionerID, @UserID, @PeriodID, @PrevReading, @CurrentReading, @BillAmount, @BillStatus, @Penalty";
var newBillingId = connection.QuerySingle<int>(sql, model);
```

### SP_UpdateBilling
**Purpose:** Update bill details
**Parameters:** All billing fields
**Backend Usage:**
```csharp
var sql = @"EXEC SP_UpdateBilling 
    @BillingID, @ConcessionerID, @UserID, @PeriodID, @PrevReading, @CurrentReading, 
    @BillAmount, @Penalty, @BillStatus";
var rowsAffected = connection.Execute(sql, model);
```

### SP_DeleteBilling
**Purpose:** Delete bill
**Parameters:** @BillingID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeleteBilling @BillingID";
var rowsAffected = connection.Execute(sql, new { BillingID = id });
```

---

## TABLE 9: PAYMENT STORED PROCEDURES

### SP_GetAllPayment
**Purpose:** Retrieve all payments
**Parameters:** None
**Returns:** PaymentID, BillingID, AmountPaid, DatePaid
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetAllPayment";
var payments = connection.Query<PaymentModel>(sql).ToList();
```

### SP_GetPaymentById
**Purpose:** Retrieve single payment
**Parameters:** @PaymentID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetPaymentById @PaymentID";
var payment = connection.QuerySingleOrDefault<PaymentModel>(sql, new { PaymentID = id });
```

### SP_GetPaymentByBillingId ⭐ IMPORTANT
**Purpose:** Get all payments for a specific bill
**Parameters:** @BillingID INT
**Returns:** All payments for that bill, ordered by newest first
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetPaymentByBillingId @BillingID";
var billPayments = connection.Query<PaymentModel>(sql, new { BillingID = billingId }).ToList();
```

### SP_InsertPayment
**Purpose:** Create payment record
**Parameters:** @BillingID INT, @AmountPaid DECIMAL(10,2)
**Returns:** PaymentID
**Backend Usage:**
```csharp
var sql = "EXEC SP_InsertPayment @BillingID, @AmountPaid";
var newPaymentId = connection.QuerySingle<int>(sql, new { 
    BillingID = model.BillingID, 
    AmountPaid = model.AmountPaid 
});
```

### SP_UpdatePayment
**Purpose:** Update payment details
**Parameters:** @PaymentID, @BillingID, @AmountPaid, @DatePaid
**Backend Usage:**
```csharp
var sql = "EXEC SP_UpdatePayment @PaymentID, @BillingID, @AmountPaid, @DatePaid";
var rowsAffected = connection.Execute(sql, model);
```

### SP_DeletePayment
**Purpose:** Delete payment record
**Parameters:** @PaymentID INT
**Backend Usage:**
```csharp
var sql = "EXEC SP_DeletePayment @PaymentID";
var rowsAffected = connection.Execute(sql, new { PaymentID = id });
```

---

## AGGREGATE FUNCTION STORED PROCEDURES (DASHBOARD REPORTS)

### SP_ShowTotalActiveConcessioners ⭐ CRITICAL
**Purpose:** Count total active customers
**Parameters:** @Status VARCHAR(50) = 'Active'
**Returns:** TotalActiveConcessioners (single integer)
**Backend Usage:**
```csharp
var sql = "EXEC SP_ShowTotalActiveConcessioners @Status";
var totalActive = connection.QuerySingle<dynamic>(sql, new { Status = "Active" }).TotalActiveConcessioners;
```
**Frontend Usage:**
```javascript
// Already implemented in admin.js dashboard
fetch('/api/Concessioner/active/count?status=Active')
  .then(res => res.json())
  .then(data => updateDashboardCard('activeMembers', data));
```

### SP_GetMonthlyWaterConsumption ⭐ CRITICAL
**Purpose:** Calculate total water consumed in a month
**Parameters:** @StartDate DATETIME, @EndDate DATETIME
**Returns:** WaterConsumed (in cubic meters)
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetMonthlyWaterConsumption @StartDate, @EndDate";
var waterConsumed = connection.QuerySingle<dynamic>(sql, new { 
    StartDate = monthStart, 
    EndDate = monthEnd 
}).WaterConsumed;
```
**Frontend Usage:**
```javascript
// Already implemented in admin.js for water consumption card
fetch('/api/Billing/water-consumption/latest-month')
  .then(res => res.json())
  .then(data => updateDashboardCard('waterConsumed', data + ' m³'));
```

### SP_ShowSumAmountofPendingConcessioner
**Purpose:** Calculate total unpaid billing amount
**Parameters:** None
**Returns:** PendingCollections (sum of unpaid bills)
**Backend Usage:**
```csharp
var sql = "EXEC SP_ShowSumAmountofPendingConcessioner @BillStatus";
var pendingAmount = connection.QuerySingle<dynamic>(sql, new { BillStatus = "Unpaid" }).PendingCollections;
```

### SP_GetTotalConcessioners
**Purpose:** Count total concessioners (all status)
**Parameters:** None
**Returns:** TotalConcessioners
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetTotalConcessioners";
var totalCount = connection.QuerySingle<dynamic>(sql).TotalConcessioners;
```

### SP_GetTotalBillingByPeriod
**Purpose:** Get billing summary for a period
**Parameters:** @PeriodID INT
**Returns:** TotalBillingAmount, TotalBills, TotalPenalty
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetTotalBillingByPeriod @PeriodID";
var summary = connection.QuerySingleOrDefault<dynamic>(sql, new { PeriodID = periodId });
```

### SP_GetTotalPaymentCollections
**Purpose:** Get collection summary for date range
**Parameters:** @StartDate DATETIME, @EndDate DATETIME
**Returns:** TotalPaymentCollected, TotalPayments
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetTotalPaymentCollections @StartDate, @EndDate";
var collections = connection.QuerySingleOrDefault<dynamic>(sql, new { 
    StartDate = startDate, 
    EndDate = endDate 
});
```

### SP_GetUnpaidBillsSummary
**Purpose:** Get unpaid bills overview
**Parameters:** None
**Returns:** UnpaidBillsCount, TotalUnpaidAmount
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetUnpaidBillsSummary";
var summary = connection.QuerySingleOrDefault<dynamic>(sql);
```

### SP_GetOverdueBillsSummary
**Purpose:** Get overdue bills overview
**Parameters:** None
**Returns:** OverdueBillsCount, TotalOverdueAmount
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetOverdueBillsSummary";
var summary = connection.QuerySingleOrDefault<dynamic>(sql);
```

---

## ADVANCED REPORT STORED PROCEDURES (SUBQUERIES)

### SP_GetDistrictConsumptionSummary
**Purpose:** Shows water consumption by district for latest period
**Parameters:** None
**Returns:** DistrictID, DistrictName, TotalCustomers, TotalConsumption, AvgConsumption (ordered by highest usage)
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetDistrictConsumptionSummary";
var districtStats = connection.Query<dynamic>(sql).ToList();
```

### SP_GetBillingWithPaymentSummary
**Purpose:** Comprehensive view of all bills with payment details
**Parameters:** None
**Returns:** Account info, bill details, payment status, consumption, payment count
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetBillingWithPaymentSummary";
var fullBillingReport = connection.Query<dynamic>(sql).ToList();
```

### SP_GetActiveCustomerDebtAndUsageSummary ⭐ USEFUL
**Purpose:** Active customers with debt and water usage
**Parameters:** None
**Returns:** Customer name, account, district, membership, total owed, total consumed
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetActiveCustomerDebtAndUsageSummary";
var activeDebtors = connection.Query<dynamic>(sql).ToList();
```

### SP_GetDelinquentCustomersReport
**Purpose:** All delinquent customers with outstanding debts
**Parameters:** None
**Returns:** Customer info, outstanding amount, bill dates
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetDelinquentCustomersReport";
var delinquent = connection.Query<dynamic>(sql).ToList();
```

### SP_GetCollectionPerformanceSummary
**Purpose:** Payment collection performance by each admin/collector
**Parameters:** @StartDate DATETIME, @EndDate DATETIME
**Returns:** Collector name, payment count, total collected, bills processed
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetCollectionPerformanceSummary @StartDate, @EndDate";
var performance = connection.Query<dynamic>(sql, new { 
    StartDate = startDate, 
    EndDate = endDate 
}).ToList();
```

### SP_GetMonthlyRevenueReport
**Purpose:** Monthly billing and revenue trends
**Parameters:** @Year INT
**Returns:** Month, total billings, total revenue, total collected, outstanding
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetMonthlyRevenueReport @Year";
var monthlyRevenue = connection.Query<dynamic>(sql, new { Year = 2026 }).ToList();
```

### SP_GetCustomerAccountDetailReport
**Purpose:** Complete account detail for single customer
**Parameters:** @ConcessionerID INT
**Returns:** All account info, payment history, total bills, outstanding amount
**Backend Usage:**
```csharp
var sql = "EXEC SP_GetCustomerAccountDetailReport @ConcessionerID";
var accountDetail = connection.QuerySingleOrDefault<dynamic>(sql, new { ConcessionerID = id });
```

---

## INTEGRATION STEPS FOR AQUENTALIBRARY

### Step 1: Copy ALL Stored Procedures
```
1. Open SQL Server Management Studio
2. Connect to AquentaDB
3. Open the StoredProcedures.sql file
4. Execute (Ctrl+E)
5. Verify all SPs created successfully
```

### Step 2: Update Repository Classes
Modify each Repository class in `/AquentaLibrary/Repositories/` to use SPs instead of raw queries:

**Example: DistrictRepository.cs**
```csharp
using Dapper;
using AquentaLibrary.Models;
using System.Data;

public class DistrictRepository : IGenericRepository<DistrictModel>
{
    private IDbConnection _connection;

    public DistrictRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public DistrictModel GetById(int id)
    {
        var sql = "EXEC SP_GetDistrictById @DistrictID";
        return _connection.QuerySingleOrDefault<DistrictModel>(sql, new { DistrictID = id });
    }

    public IEnumerable<DistrictModel> GetAll()
    {
        var sql = "EXEC SP_GetAllDistrict";
        return _connection.Query<DistrictModel>(sql).ToList();
    }

    public int Add(DistrictModel model)
    {
        var sql = "EXEC SP_InsertDistrict @DistrictName";
        return _connection.QuerySingle<int>(sql, new { DistrictName = model.DistrictName });
    }

    public int Update(DistrictModel model)
    {
        var sql = "EXEC SP_UpdateDistrict @DistrictID, @DistrictName";
        return _connection.Execute(sql, new { DistrictID = model.DistrictID, DistrictName = model.DistrictName });
    }

    public int Delete(int id)
    {
        var sql = "EXEC SP_DeleteDistrict @DistrictID";
        return _connection.Execute(sql, new { DistrictID = id });
    }
}
```

**Repeat this pattern for all other repositories:**
- CategoryRepository
- MembershipRepository
- UserRepository (already partially done)
- ConcessionerRepository
- PeriodRepository
- BillingRepository (already partially done)
- PaymentRepository
- TariffsRepository

### Step 3: Update Service Classes
Minor updates to service layer:
```csharp
// All service methods will automatically work once Repository uses SPs
// Example: CategoryServices.cs

public class CategoryServices
{
    private readonly CategoryRepository _repository;

    public CategoryServices(CategoryRepository repository)
    {
        _repository = repository;
    }

    public List<CategoryModel> GetAllCategories()
    {
        return _repository.GetAll().ToList();  // Now calls SP_GetAllCategory
    }

    public CategoryModel GetCategoryById(int id)
    {
        return _repository.GetById(id);  // Now calls SP_GetCategoryById
    }
}
```

### Step 4: Update Controllers with Report Endpoints
Add new endpoints to your API controllers:

**Example: Dashboard Controller (NEW)**
```csharp
[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private IDbConnection _connection;
    private readonly BillingServices _billingServices;

    public ReportController(IDbConnection connection, BillingServices billingServices)
    {
        _connection = connection;
        _billingServices = billingServices;
    }

    [HttpGet("dashboard/summary")]
    public ActionResult<dynamic> GetDashboardSummary()
    {
        try
        {
            var totalActive = _connection.QuerySingle<dynamic>("EXEC SP_ShowTotalActiveConcessioners @Status", 
                new { Status = "Active" }).TotalActiveConcessioners;
            
            var unpaidSummary = _connection.QuerySingleOrDefault<dynamic>("EXEC SP_GetUnpaidBillsSummary");
            
            var delinquentSummary = _connection.QuerySingleOrDefault<dynamic>("EXEC SP_GetOverdueBillsSummary");

            return Ok(new
            {
                totalActive = totalActive,
                unpaidBills = unpaidSummary?.UnpaidBillsCount ?? 0,
                totalUnpaid = unpaidSummary?.TotalUnpaidAmount ?? 0,
                delinquentBills = delinquentSummary?.OverdueBillsCount ?? 0,
                totalDelinquent = delinquentSummary?.TotalOverdueAmount ?? 0
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("district/consumption")]
    public ActionResult<List<dynamic>> GetDistrictConsumption()
    {
        try
        {
            var result = _connection.Query<dynamic>("EXEC SP_GetDistrictConsumptionSummary").ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("revenue/monthly")]
    public ActionResult<List<dynamic>> GetMonthlyRevenue(int year)
    {
        try
        {
            var result = _connection.Query<dynamic>("EXEC SP_GetMonthlyRevenueReport @Year", 
                new { Year = year }).ToList();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
```

### Step 5: Test Each SP
```sql
-- Test District SPs
EXEC SP_GetAllDistrict;
EXEC SP_GetDistrictById 1;
EXEC SP_InsertDistrict 'Purok 8';
EXEC SP_UpdateDistrict 1, 'Purok 1 Updated';
EXEC SP_DeleteDistrict 8;

-- Test User Login
EXEC SP_GetUserByUsername 'admin';
EXEC SP_GetUserByUsername 'Mark01';

-- Test Billing
EXEC SP_GetBillingByConcessionerId 3;
EXEC SP_GetBillingByStatus 'Unpaid';

-- Test Aggregate Reports
EXEC SP_ShowTotalActiveConcessioners 'Active';
EXEC SP_GetMonthlyWaterConsumption '2026-03-01', '2026-04-01';
EXEC SP_GetUnpaidBillsSummary;
```

---

## MIGRATION CHECKLIST

✅ Copy StoredProcedures.sql to SQL Server Management Studio
✅ Execute script to create all SPs
✅ Update DistrictRepository to use SPs
✅ Update CategoryRepository to use SPs
✅ Update MembershipRepository to use SPs
✅ Update TariffsRepository to use SPs
✅ Update UserRepository to use SPs (use SP_GetUserByUsername for LOGIN)
✅ Update ConcessionerRepository to use SPs
✅ Update PeriodRepository to use SPs
✅ Update BillingRepository to use SPs
✅ Update PaymentRepository to use SPs
✅ Create ReportController with dashboard endpoints
✅ Test all CRUD endpoints via Postman
✅ Test all report endpoints
✅ Update frontend API calls if needed
✅ Rebuild and deploy

---

## NAMING CONVENTION REFERENCE

| Action | Convention | Example |
|--------|-----------|---------|
| Get All Records | SP_GetAll[TableName] | SP_GetAllUser |
| Get Single Record | SP_Get[TableName]ById | SP_GetUserById |
| Get by Condition | SP_Get[TableName]By[Condition] | SP_GetConcessionerByStatus |
| Insert | SP_Insert[TableName] | SP_InsertBilling |
| Update | SP_Update[TableName] | SP_UpdateUser |
| Delete | SP_Delete[TableName] | SP_DeleteDistrict |
| Report/Aggregate | SP_[ActionName][Entity] | SP_ShowTotalActiveConcessioners |

---

## NOTES

1. All SPs use EXEC keyword - this is the recommended SQL Server syntax
2. All identity-returning SPs use SCOPE_IDENTITY() which is safer than @@IDENTITY
3. For Dapper execution, always use parameterized queries to prevent SQL injection
4. All date filters use >= and < for proper period coverage (start inclusive, end exclusive)
5. Aggregate SPs return dynamic/single row - not list
6. Report SPs handle NULL values with ISNULL() to prevent NULL in aggregate columns

---

## QUICK COPY-PASTE TEMPLATE

```csharp
// Repository Method Template
public TypeReturnHere MethodName(parameters)
{
    var sql = "EXEC SP_NameHere @Parameter1, @Parameter2";
    var result = _connection.QuerySingleOrDefault<DynamicOrModel>(sql, 
        new { Parameter1 = param1Value, Parameter2 = param2Value });
    return result;
}
```

```sql
-- SP Execution Template
EXEC SP_NameHere @Parameter1, @Parameter2;
```

---

Created: March 24, 2026
Last Updated: March 24, 2026
Version: 1.0
