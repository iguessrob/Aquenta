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
    public class PaymentRepository : GenericRepository<PaymentModel>
    {
        public bool AddPayment(PaymentModel payment)
        {
            return Add(payment);
        }

        public bool DeletePayment(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all payments using SP_GetAllPayment
        /// </summary>
        public IEnumerable<PaymentModel> GetAllPayment()
        {
            return dbConnection.Query<PaymentModel>(
                "SP_GetAllPayment",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get payment by ID using SP_GetPaymentById
        /// </summary>
        public PaymentModel GetPaymentById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@PaymentID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<PaymentModel>(
                "SP_GetPaymentById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get payments by billing ID using SP_GetPaymentByBillingId
        /// </summary>
        public IEnumerable<PaymentModel> GetPaymentByBillingId(int billingId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@BillingID", billingId, DbType.Int32);

            return dbConnection.Query<PaymentModel>(
                "SP_GetPaymentByBillingId",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert payment using SP_InsertPayment
        /// </summary>
        public int InsertPayment(PaymentModel payment)
        {
            var parameters = new DynamicParameters();
               parameters.Add("@PaymentID", payment.PaymentId, DbType.Int32);
               parameters.Add("@BillingID", payment.BillingId, DbType.Int32);
            parameters.Add("@AmountPaid", payment.AmountPaid, DbType.Decimal);
               parameters.Add("@DatePaid", payment.DatePaid, DbType.DateTime);

            return dbConnection.QuerySingle<int>(
                "SP_InsertPayment",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update payment using SP_UpdatePayment
        /// </summary>
        public int UpdatePaymentSP(PaymentModel payment)
        {
            var parameters = new DynamicParameters();
                parameters.Add("@PaymentID", payment.PaymentId, DbType.Int32);
                parameters.Add("@BillingID", payment.BillingId, DbType.Int32);
            parameters.Add("@AmountPaid", payment.AmountPaid, DbType.Decimal);
            parameters.Add("@DatePaid", payment.DatePaid, DbType.DateTime);

            return dbConnection.Execute(
                "SP_UpdatePayment",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Delete payment using SP_DeletePayment
        /// </summary>
        public int DeletePaymentSP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@PaymentID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeletePayment",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get total payment collections using SP_GetTotalPaymentCollections
        /// </summary>
        public dynamic GetTotalPaymentCollections(DateTime startDate, DateTime endDate)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@StartDate", startDate, DbType.DateTime);
            parameters.Add("@EndDate", endDate, DbType.DateTime);

            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetTotalPaymentCollections",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdatePayment(PaymentModel payment)
        {
            return Update(payment);
        }

        /// <summary>
        /// Get all payments for a specific concessioner by joining tbl_Payment with tbl_Billing
        /// </summary>
        public IEnumerable<PaymentModel> GetPaymentsByConcessionerId(int concessionerId)
        {
            var sql = @"SELECT p.PaymentID as PaymentId, p.BillingID as BillingId, p.AmountPaid, p.DatePaid, 
                               per.PeriodStart, per.PeriodEnd, b.BillAmount, b.Penalty
                        FROM tbl_Payment p
                        INNER JOIN tbl_Billing b ON p.BillingID = b.BillingID
                        INNER JOIN tbl_Period per ON b.PeriodID = per.PeriodID
                        WHERE b.ConcessionerID = @ConcessionerID
                        ORDER BY p.DatePaid DESC";

            var parameters = new DynamicParameters();
            parameters.Add("@ConcessionerID", concessionerId, DbType.Int32);

            return dbConnection.Query<PaymentModel>(sql, parameters);
        }
        /// <summary>
        /// Distribute payment across unpaid billings (arrears-first) using SP_DistributePayment
        /// </summary>
        public IEnumerable<dynamic> DistributePayment(int concessionerId, decimal amountPaid, int currentBillingId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@ConcessionerID", concessionerId, DbType.Int32);
            parameters.Add("@TotalAmountPaid", amountPaid, DbType.Decimal);
            parameters.Add("@CurrentBillingID", currentBillingId, DbType.Int32);

            return dbConnection.Query<dynamic>(
                "SP_DistributePayment",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Reverse all payment distributions for a concessioner using SP_ReverseDistribution
        /// </summary>
        public IEnumerable<dynamic> ReverseDistribution(int concessionerId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@ConcessionerID", concessionerId, DbType.Int32);

            return dbConnection.Query<dynamic>(
                "SP_ReverseDistribution",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
    }
}
