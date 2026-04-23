using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using Dapper;

namespace AquentaLibrary.Repositories
{
    public class BillingRepository : GenericRepository<BillingModel>
    {
        public bool AddBilling(BillingModel billing)
        {
            return Add(billing);
        }

        public bool DeleteBilling(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all billings using SP_GetAllBilling
        /// </summary>
        public IEnumerable<BillingModel> GetAllBilling()
        {
            var parameters = new DynamicParameters();
            return dbConnection.Query<BillingModel>(
                "SP_GetAllBilling",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get billing by ID using SP_GetBillingById
        /// </summary>
        public BillingModel GetBillingById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@BillingID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<BillingModel>(
                "SP_GetBillingById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get all billings by concessioner ID using SP_GetBillingByConcessionerId
        /// </summary>
        public IEnumerable<BillingModel> GetBillingByConcessionerId(int concessionerId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@ConcessionerID", concessionerId, DbType.Int32);

            return dbConnection.Query<BillingModel>(
                "SP_GetBillingByConcessionerId",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get billings by status using SP_GetBillingByStatus
        /// </summary>
        public IEnumerable<BillingModel> GetBillingByStatus(string billStatus)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@BillStatus", billStatus, DbType.String);

            return dbConnection.Query<BillingModel>(
                "SP_GetBillingByStatus",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert billing using SP_InsertBilling
        /// </summary>
        public int InsertBilling(BillingModel billing)
        {
            var parameters = new DynamicParameters();
                parameters.Add("@ConcessionerID", billing.ConcessionerID, DbType.Int32);
                parameters.Add("@UserId", billing.UserId, DbType.Int32);
                parameters.Add("@PeriodId", billing.PeriodId, DbType.Int32);
             parameters.Add("@PrevReading", billing.PrevReading, DbType.Int32);
             parameters.Add("@CurrentReading", billing.CurrentReading, DbType.Int32);
             parameters.Add("@BillAmount", billing.BillAmount, DbType.Decimal);
                 parameters.Add("@Penalty", billing.Penalty, DbType.Decimal);
                parameters.Add("@BillStatus", billing.BillStatus, DbType.String);
                parameters.Add("@CreatedAt", billing.CreatedAt, DbType.DateTime);

            return dbConnection.QuerySingle<int>(
                "SP_InsertBilling",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update billing using SP_UpdateBilling
        /// </summary>
        public int UpdateBillingSP(BillingModel billing)
        {
            var parameters = new DynamicParameters();
                parameters.Add("@BillingId", billing.BillingId, DbType.Int32);
                parameters.Add("@ConcessionerID", billing.ConcessionerID, DbType.Int32);
                parameters.Add("@UserId", billing.UserId, DbType.Int32);
                parameters.Add("@PeriodId", billing.PeriodId, DbType.Int32);
             parameters.Add("@PrevReading", billing.PrevReading, DbType.Int32);
             parameters.Add("@CurrentReading", billing.CurrentReading, DbType.Int32);
             parameters.Add("@BillAmount", billing.BillAmount, DbType.Decimal);
                 parameters.Add("@Penalty", billing.Penalty, DbType.Decimal);
             parameters.Add("@BillStatus", billing.BillStatus, DbType.String);
                parameters.Add("@CreatedAt", billing.CreatedAt, DbType.DateTime);

            return dbConnection.Execute(
                "SP_UpdateBilling",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Delete billing using SP_DeleteBilling
        /// </summary>
        public int DeleteBillingSP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@BillingID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteBilling",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get monthly water consumption using SP_GetMonthlyWaterConsumption
        /// </summary>
        public int GetMonthlyWaterConsumption(DateTime startDate, DateTime endDate)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@StartDate", startDate, DbType.DateTime);
            parameters.Add("@EndDate", endDate, DbType.DateTime);

            return dbConnection.QuerySingle<int>(
                "SP_GetMonthlyWaterConsumption",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get latest month water consumption
        /// </summary>
        public int GetLatestMonthWaterConsumption()
        {
            var latestPeriodConsumption = dbConnection.QuerySingleOrDefault<int?>(@"
                SELECT ISNULL(SUM(CAST((b.CurrentReading - b.PrevReading) AS INT)), 0)
                FROM tbl_Billing b
                WHERE b.PeriodID = (
                    SELECT TOP 1 b2.PeriodID
                    FROM tbl_Billing b2
                    INNER JOIN tbl_Period p ON b2.PeriodID = p.PeriodID
                    ORDER BY p.PeriodEnd DESC, b2.CreatedAt DESC
                );");

            if (latestPeriodConsumption.HasValue)
            {
                return latestPeriodConsumption.Value;
            }

            // Fallback for older datasets where Period linkage is incomplete.
            var latestBillingDate = dbConnection.QueryFirstOrDefault<DateTime?>(
                "SELECT MAX([CreatedAt]) FROM [tbl_Billing]");

            if (!latestBillingDate.HasValue)
            {
                return 0;
            }

            var latest = latestBillingDate.Value;
            var startDate = new DateTime(latest.Year, latest.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);
            var endDate = startDate.AddMonths(1);

            return GetMonthlyWaterConsumption(startDate, endDate);
        }

        /// <summary>
        /// Get unpaid bills summary using SP_GetUnpaidBillsSummary
        /// </summary>
        public dynamic GetUnpaidBillsSummary()
        {
            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetUnpaidBillsSummary",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get overdue bills summary using SP_GetOverdueBillsSummary
        /// </summary>
        public dynamic GetOverdueBillsSummary()
        {
            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetOverdueBillsSummary",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get total billing by period using SP_GetTotalBillingByPeriod
        /// </summary>
        public dynamic GetTotalBillingByPeriod(int periodId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@PeriodID", periodId, DbType.Int32);

            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetTotalBillingByPeriod",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get comprehensive billing with payment summary using SP_GetBillingWithPaymentSummary
        /// </summary>
        public IEnumerable<dynamic> GetBillingWithPaymentSummary()
        {
            return dbConnection.Query<dynamic>(
                "SP_GetBillingWithPaymentSummary",
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdateBilling(BillingModel billing)
        {
            return Update(billing);
        }
    }
}
