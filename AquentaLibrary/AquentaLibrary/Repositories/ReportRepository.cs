using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;

namespace AquentaLibrary.Repositories
{
    /// <summary>
    /// ReportRepository - Handles all aggregate functions and advanced report stored procedures
    /// Purpose: Dashboard reports, statistics, and business intelligence queries
    /// </summary>
    public class ReportRepository
    {
        private string ConnectionString => SqlConnectionResolver.GetWorkingConnectionString();

        private IDbConnection CreateConnection()
        {
            return new SqlConnection(ConnectionString);
        }

        public ReportRepository()
        {
        }

        // ==================== AGGREGATE FUNCTIONS (DASHBOARD) ====================

        /// <summary>
        /// Get total active concessioners using SP_ShowTotalActiveConcessioners
        /// </summary>
        public int GetTotalActiveConcessioners(string status = "Active")
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Status", status, DbType.String);

            return dbConnection.QuerySingle<int>(
                "SP_TotalNumberOfRegisteredConcessioners",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get monthly water consumption using SP_GetMonthlyWaterConsumption
        /// </summary>
        public int GetMonthlyWaterConsumption(DateTime startDate, DateTime endDate)
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@StartDate", startDate, DbType.DateTime);
            parameters.Add("@EndDate", endDate, DbType.DateTime);

            return dbConnection.QuerySingle<int>(
                "SP_GetTotalConsumptionCurrentMonth",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get unpaid bills amount using SP_ShowSumAmountofPendingConcessioner
        /// </summary>
        public decimal GetPendingCollections()
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@BillStatus", "Unpaid", DbType.String);

            var result = dbConnection.QuerySingleOrDefault<decimal?>(
                "SP_ShowSumAmountofPendingConcessioner",
                parameters,
                commandType: CommandType.StoredProcedure);

            return result ?? 0;
        }

        /// <summary>
        /// Get latest month pending collections using SP_GetLatestMonthPendingCollections
        /// </summary>
        public decimal GetLatestMonthPendingCollections()
        {
            using var dbConnection = CreateConnection();
            var result = dbConnection.QuerySingleOrDefault<decimal?>(
                "SP_GetLatestMonthPendingCollections",
                commandType: CommandType.StoredProcedure);

            return result ?? 0;
        }

        /// <summary>
        /// Get total monthly account receivable using SP_GetTotalMonthlyAccountReceivable
        /// </summary>
        public decimal GetTotalMonthlyAccountReceivable()
        {
            using var dbConnection = CreateConnection();
            var result = dbConnection.QuerySingleOrDefault<decimal?>(
                "SP_GetTotalMonthlyAccountReceivable",
                commandType: CommandType.StoredProcedure);

            return result ?? 0;
        }

        /// <summary>
        /// Get total monthly collection using SP_GetTotalMonthlyCollection
        /// </summary>
        public decimal GetTotalMonthlyCollection()
        {
            using var dbConnection = CreateConnection();
            var result = dbConnection.QuerySingleOrDefault<decimal?>(
                "SP_GetTotalMonthlyCollection",
                commandType: CommandType.StoredProcedure);

            return result ?? 0;
        }

        /// <summary>
        /// Get total annual account receivable using SP_GetTotalAnnualAccountReceivable
        /// </summary>
        public decimal GetTotalAnnualAccountReceivable()
        {
            using var dbConnection = CreateConnection();
            var result = dbConnection.QuerySingleOrDefault<decimal?>(
                "SP_GetTotalAnnualAccountReceivable",
                commandType: CommandType.StoredProcedure);

            return result ?? 0;
        }

        /// <summary>
        /// Get total concessioners count using SP_GetTotalConcessioners
        /// </summary>
        public int GetTotalConcessioners()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.QuerySingle<int>(
                "SP_GetTotalConcessioners",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get total billing by period using SP_GetTotalBillingByPeriod
        /// </summary>
        public dynamic GetTotalBillingByPeriod(int periodId)
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@PeriodID", periodId, DbType.Int32);

            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetTotalBillingByPeriod",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get total payment collections in date range using SP_GetTotalPaymentCollections
        /// </summary>
        public dynamic GetTotalPaymentCollections(DateTime startDate, DateTime endDate)
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@StartDate", startDate, DbType.DateTime);
            parameters.Add("@EndDate", endDate, DbType.DateTime);

            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetTotalPaymentCollections",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get unpaid bills summary using SP_GetUnpaidBillsSummary
        /// </summary>
        public dynamic GetUnpaidBillsSummary()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetArrearSummaryReport",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get overdue bills summary using SP_GetOverdueBillsSummary
        /// </summary>
        public dynamic GetOverdueBillsSummary()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetArrearSummaryReport",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get billing progress grouped by district for a specific period.
        /// Source of district labels is tbl_District.
        /// Only counts active concessioners.
        /// </summary>
        public IEnumerable<dynamic> GetBillingProgressByZone(int periodId)
        {
            using var dbConnection = CreateConnection();
            const string sql = @"
                SELECT
                    d.DistrictID AS DistrictId,
                    d.DistrictName AS DistrictName,
                    COUNT(c.ConcessionerID) AS TotalReadings,
                    SUM(CASE WHEN b.BillingID IS NOT NULL AND b.CurrentReading > 0 THEN 1 ELSE 0 END) AS CompletedReadings
                FROM tbl_District d
                LEFT JOIN tbl_Concessioner c
                    ON c.DistrictID = d.DistrictID AND c.Status = 'Active'
                LEFT JOIN tbl_Billing b
                    ON b.ConcessionerID = c.ConcessionerID
                    AND b.PeriodID = @PeriodID
                GROUP BY d.DistrictID, d.DistrictName
                ORDER BY d.DistrictID";

            var parameters = new DynamicParameters();
            parameters.Add("@PeriodID", periodId, DbType.Int32);

            return dbConnection.Query<dynamic>(sql, parameters);
        }

        /// <summary>
        /// Get arrear summary using SP_GetArrearSummaryReport.
        /// Purpose: Shows unpaid and overdue balances with penalties, including current month.
        /// </summary>
        public IEnumerable<dynamic> GetArrearSummaryReport()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.Query<dynamic>(
                "SP_GetArrearSummaryReport",
                commandType: CommandType.StoredProcedure);
        }

        // ==================== NEW REFACTORED REPORTS (V3) ====================

        /// <summary>
        /// Get total overdue amount and count using SP_GetTotalOverdueAmount
        /// </summary>
        public dynamic GetTotalOverdueAmount()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetArrearSummaryReport",
                commandType: CommandType.StoredProcedure);
        }

        // ==================== ADVANCED REPORT FUNCTIONS (SUBQUERIES) ====================

        /// <summary>
        /// Get district water consumption summary using SP_GetDistrictConsumptionSummary
        /// Purpose: Shows water consumption by district for latest period
        /// </summary>
        public IEnumerable<dynamic> GetDistrictConsumptionSummary()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.Query<dynamic>(
                "SP_GetDistrictConsumptionSummary",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get comprehensive billing report with payment details using SP_GetBillingWithPaymentSummary
        /// Purpose: Shows all customer bills with payment status and billing history
        /// </summary>
        public IEnumerable<dynamic> GetBillingWithPaymentSummary()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.Query<dynamic>(
                "SP_GetBillingWithPaymentSummary",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get active customers with debt and water usage using SP_GetActiveCustomerDebtAndUsageSummary
        /// Purpose: Financial and usage summary for all Active customers
        /// </summary>
        public IEnumerable<dynamic> GetActiveCustomerDebtAndUsageSummary()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.Query<dynamic>(
                "SP_GetActiveCustomerDebtAndUsageSummary",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get delinquent customers report using SP_GetDelinquentCustomersReport
        /// Purpose: Shows customers with delinquent status and outstanding debts
        /// </summary>
        public IEnumerable<dynamic> GetDelinquentCustomersReport()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.Query<dynamic>(
                "SP_GetDelinquentCustomersReport",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get collection performance summary using SP_GetCollectionPerformanceSummary
        /// Purpose: Shows payment collection performance by each admin/collector
        /// </summary>
        public IEnumerable<dynamic> GetCollectionPerformanceSummary(DateTime startDate, DateTime endDate)
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@StartDate", startDate, DbType.DateTime);
            parameters.Add("@EndDate", endDate, DbType.DateTime);

            return dbConnection.Query<dynamic>(
                "SP_GetCollectionPerformanceSummary",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get monthly revenue report using SP_GetMonthlyRevenueReport
        /// Purpose: Shows monthly billing and payment trends
        /// </summary>
        public IEnumerable<dynamic> GetMonthlyRevenueReport(int year)
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Year", year, DbType.Int32);

            return dbConnection.Query<dynamic>(
                "SP_GetMonthlyRevenueReport",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public IEnumerable<dynamic> GetMonthlyConsumptionReport(int year)
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Year", year, DbType.Int32);

            return dbConnection.Query<dynamic>(
                "SP_GetMonthlyConsumptionReport",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get monthly mother meter vs concessioner consumption and water loss for a year.
        /// WaterLoss = MotherMeterConsumption - ConcessionerConsumption
        /// </summary>
        public IEnumerable<dynamic> GetMonthlyWaterLossReport(int year)
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Year", year, DbType.Int32);
            parameters.Add("@MotherFirstName", "MOTHER METER", DbType.String);
            parameters.Add("@MotherAccountNumber", "ACC-MOTHER-0001", DbType.String);
            parameters.Add("@MotherMeterNumber", "MTR-MOTHER-0001", DbType.String);

            return dbConnection.Query<dynamic>(
                "SP_GetMonthlyMotherMeterWaterLossReport",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get latest month water distribution summary for dashboard.
        /// ConcessionerConsumption = TotalConsumption - MotherMeterConsumption
        /// UnaccountedWater = MotherMeterConsumption - ConcessionerConsumption
        /// </summary>
        public dynamic GetLatestMonthWaterDistributionSummary()
        {
            var latestSelector = GetLatestPeriodSelector();
            if (latestSelector == null)
            {
                return new
                {
                    LatestPeriodStart = (DateTime?)null,
                    LatestPeriodEnd = (DateTime?)null,
                    LatestYear = 0,
                    LatestMonthIndex = 0,
                    TotalConsumption = 0,
                    MotherMeterConsumption = 0,
                    ConcessionerConsumption = 0,
                    UnaccountedWater = 0,
                    ConcessionerPercentage = 0m,
                    UnaccountedPercentage = 0m
                };
            }

            var latestYear = Convert.ToInt32(latestSelector.LatestYear ?? 0);
            var latestMonthIndex = Convert.ToInt32(latestSelector.LatestMonthIndex ?? 0);

            var monthlyRows = GetMonthlyWaterLossReport(latestYear);
            dynamic latestRow = null;
            foreach (var row in monthlyRows)
            {
                if (Convert.ToInt32(row.MonthIndex ?? 0) == latestMonthIndex)
                {
                    latestRow = row;
                    break;
                }
            }

            var motherMeterConsumption = Convert.ToInt32(latestRow?.MotherMeterConsumption ?? 0);
            var concessionerConsumption = Convert.ToInt32(latestRow?.ConcessionerConsumption ?? 0);
            var unaccountedWater = Convert.ToInt32(latestRow?.WaterLoss ?? (motherMeterConsumption - concessionerConsumption));
            var totalConsumption = motherMeterConsumption + concessionerConsumption;

            decimal concessionerPercent = 0;
            decimal unaccountedPercent = 0;
            if (motherMeterConsumption > 0)
            {
                concessionerPercent = Math.Round((decimal)concessionerConsumption * 100m / motherMeterConsumption, 1);
                unaccountedPercent = Math.Round((decimal)unaccountedWater * 100m / motherMeterConsumption, 1);
            }

            return new
            {
                LatestPeriodStart = (DateTime?)latestSelector.LatestPeriodStart,
                LatestPeriodEnd = (DateTime?)latestSelector.LatestPeriodEnd,
                LatestYear = latestYear,
                LatestMonthIndex = latestMonthIndex,
                TotalConsumption = totalConsumption,
                MotherMeterConsumption = motherMeterConsumption,
                ConcessionerConsumption = concessionerConsumption,
                UnaccountedWater = unaccountedWater,
                ConcessionerPercentage = concessionerPercent,
                UnaccountedPercentage = unaccountedPercent
            };
        }

        /// <summary>
        /// Get the latest billing period selector using PeriodEnd as the month basis.
        /// </summary>
        public dynamic GetLatestPeriodSelector()
        {
            using var dbConnection = CreateConnection();
            return dbConnection.QuerySingleOrDefault<dynamic>(@"
                SELECT TOP 1
                    p.PeriodID AS LatestPeriodID,
                    p.PeriodStart AS LatestPeriodStart,
                    COALESCE(p.PeriodEnd, p.PeriodStart) AS LatestPeriodEnd,
                    YEAR(COALESCE(p.PeriodEnd, p.PeriodStart)) AS LatestYear,
                    MONTH(COALESCE(p.PeriodEnd, p.PeriodStart)) AS LatestMonthIndex
                FROM tbl_Billing b
                INNER JOIN tbl_Period p ON b.PeriodID = p.PeriodID
                ORDER BY COALESCE(p.PeriodEnd, p.PeriodStart) DESC, b.CreatedAt DESC;");
        }

        /// <summary>
        /// Get customer account detail report using SP_GetCustomerAccountDetailReport
        /// Purpose: Detailed account status with contact and billing information
        /// </summary>
        public dynamic GetCustomerAccountDetailReport(int concessionerId)
        {
            using var dbConnection = CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@ConcessionerID", concessionerId, DbType.Int32);

            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetCustomerAccountDetailReport",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        // ==================== DASHBOARD SUMMARY ====================

        /// <summary>
        /// Get complete dashboard summary with all key metrics
        /// </summary>
        public dynamic GetDashboardSummary()
        {
            try
            {
                var totalActive = GetTotalActiveConcessioners("Active");
                var totalConcessioners = GetTotalConcessioners();
                var unpaidSummary = GetUnpaidBillsSummary();
                var overdueSummary = GetOverdueBillsSummary();

                // Use latest billing month present in billing records (Period-based),
                // with fallback to CreatedAt month for older/incomplete datasets.
                using var dbConnection = CreateConnection();
                var latestPeriodConsumption = dbConnection.QuerySingleOrDefault<int?>(@"
                    SELECT ISNULL(SUM(CAST((b.CurrentReading - b.PrevReading) AS INT)), 0)
                    FROM tbl_Billing b
                    WHERE b.PeriodID = (
                        SELECT TOP 1 b2.PeriodID
                        FROM tbl_Billing b2
                        INNER JOIN tbl_Period p ON b2.PeriodID = p.PeriodID
                        ORDER BY p.PeriodEnd DESC, b2.CreatedAt DESC
                    );");

                int waterConsumed;
                if (latestPeriodConsumption.HasValue)
                {
                    waterConsumed = latestPeriodConsumption.Value;
                }
                else
                {
                    var latestBillingDate = dbConnection.QueryFirstOrDefault<DateTime?>(
                        "SELECT MAX([CreatedAt]) FROM [tbl_Billing]");

                    if (!latestBillingDate.HasValue)
                    {
                        waterConsumed = 0;
                    }
                    else
                    {
                        var latest = latestBillingDate.Value;
                        var startDate = new DateTime(latest.Year, latest.Month, 1);
                        var endDate = startDate.AddMonths(1);
                        waterConsumed = GetMonthlyWaterConsumption(startDate, endDate);
                    }
                }

                var dashboard = dbConnection.QuerySingleOrDefault<dynamic>(
                    "SP_GetDashboardSummary",
                    commandType: CommandType.StoredProcedure);

                return new
                {
                    TotalActiveConcessioners = dashboard?.TotalActiveMembers ?? 0,
                    TotalConcessioners = dashboard?.TotalRegistered ?? 0,
                    WaterConsumedThisMonth = dashboard?.CurrentMonthConsumption ?? 0,
                    UnpaidBillsCount = dashboard?.OverdueConcessionerCount ?? 0,
                    TotalUnpaidAmount = dashboard?.TotalOverdueAmount ?? 0,
                    OverdueBillsCount = dashboard?.OverdueConcessionerCount ?? 0,
                    TotalOverdueAmount = dashboard?.TotalOverdueAmount ?? 0
                };
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving dashboard summary: {ex.Message}", ex);
            }
        }
    }
}
