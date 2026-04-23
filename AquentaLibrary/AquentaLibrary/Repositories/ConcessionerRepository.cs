using System.Data;
using Dapper;
using AquentaLibrary.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Repositories
{
    public class ConcessionerRepository : GenericRepository<ConcessionerModel>
    {
        public bool AddConcessioner(ConcessionerModel concessioner)
        {
            return InsertConcessioner(concessioner) > 0;
        }

        public bool DeleteConcessioner(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all concessioners using SP_GetAllConcessioner
        /// </summary>
        public IEnumerable<ConcessionerModel> GetAllConcessioner()
        {
            var parameters = new DynamicParameters();
            return dbConnection.Query<ConcessionerModel>(
                "SP_GetAllConcessioner",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get active concessioners using SP_GetAllActiveConcessioner
        /// </summary>
        public IEnumerable<ConcessionerModel> GetAllActiveConcessioner()
        {
            var parameters = new DynamicParameters();
            return dbConnection.Query<ConcessionerModel>(
                "SP_GetAllActiveConcessioner",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get concessioner by ID using SP_GetConcessionerById
        /// </summary>
        public ConcessionerModel GetConcessionerById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@ConcessionerID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<ConcessionerModel>(
                "SP_GetConcessionerById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get concessioners by status using SP_GetConcessionerByStatus
        /// </summary>
        public IEnumerable<ConcessionerModel> GetConcessionerByStatus(string status)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Status", status, DbType.String);

            return dbConnection.Query<ConcessionerModel>(
                "SP_GetConcessionerByStatus",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get concessioners by district ID using SP_GetConcessionerByDistrictId
        /// </summary>
        public IEnumerable<ConcessionerModel> GetConcessionerByDistrictId(int districtId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@DistrictID", districtId, DbType.Int32);

            return dbConnection.Query<ConcessionerModel>(
                "SP_GetConcessionerByDistrictId",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get concessioners by user ID using SP_GetConcessionerByUserId
        /// </summary>
        public IEnumerable<ConcessionerModel> GetConcessionerByUserId(int userId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@UserID", userId, DbType.Int32);

            return dbConnection.Query<ConcessionerModel>(
                "SP_GetConcessionerByUserId",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert concessioner using SP_InsertConcessioner
        /// </summary>
        public int InsertConcessioner(ConcessionerModel concessioner)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@UserID", concessioner.UserId, DbType.Int32);
            parameters.Add("@CategoryID", concessioner.CategoryId, DbType.Int32);
            parameters.Add("@MembershipID", concessioner.MembershipId, DbType.Int32);
            parameters.Add("@DistrictID", concessioner.DistrictId, DbType.Int32);
            parameters.Add("@AccountNumber", concessioner.AccountNumber, DbType.String);
            parameters.Add("@AccountOrder", concessioner.AccountOrder, DbType.Int32);
            parameters.Add("@MeterNumber", concessioner.MeterNumber, DbType.String);
            parameters.Add("@Address", concessioner.Address, DbType.String);
            parameters.Add("@ContactNumber", concessioner.ContactNumber, DbType.String);
            parameters.Add("@EmailAddress", concessioner.EmailAddress, DbType.String);
            parameters.Add("@Status", concessioner.Status, DbType.String);

            return dbConnection.QuerySingle<int>(
                "SP_InsertConcessioner",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update concessioner using SP_UpdateConcessioner
        /// </summary>
        public int UpdateConcessionerSP(ConcessionerModel concessioner)
        {
            var parameters = new DynamicParameters();
                parameters.Add("@ConcessionerID", concessioner.ConcessionerId, DbType.Int32);
            parameters.Add("@UserID", concessioner.UserId, DbType.Int32);
            parameters.Add("@CategoryID", concessioner.CategoryId, DbType.Int32);
            parameters.Add("@MembershipID", concessioner.MembershipId, DbType.Int32);
            parameters.Add("@DistrictID", concessioner.DistrictId, DbType.Int32);
            parameters.Add("@AccountNumber", concessioner.AccountNumber, DbType.String);
            parameters.Add("@AccountOrder", concessioner.AccountOrder, DbType.Int32);
            parameters.Add("@MeterNumber", concessioner.MeterNumber, DbType.String);
            parameters.Add("@Address", concessioner.Address, DbType.String);
            parameters.Add("@ContactNumber", concessioner.ContactNumber, DbType.String);
            parameters.Add("@EmailAddress", concessioner.EmailAddress, DbType.String);
            parameters.Add("@Status", concessioner.Status, DbType.String);

            return dbConnection.Execute(
                "SP_UpdateConcessioner",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Delete concessioner using SP_DeleteConcessioner
        /// </summary>
        public int DeleteConcessionerSP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@ConcessionerID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteConcessioner",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get total concessioners using SP_GetTotalConcessioners
        /// </summary>
        public int GetTotalConcessioners()
        {
            return dbConnection.QuerySingle<int>(
                "SP_GetTotalConcessioners",
                commandType: CommandType.StoredProcedure);
        }

        // Calls stored procedure: SP_ShowTotalActiveConcessioners @Status VARCHAR(50)
        public int GetTotalActiveConcessioners(string status)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Status", status, DbType.String, size: 50);

            return dbConnection.QuerySingle<int>(
                "SP_ShowTotalActiveConcessioners",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get active customers with debt and water usage summary
        /// </summary>
        public IEnumerable<dynamic> GetActiveCustomerDebtAndUsageSummary()
        {
            return dbConnection.Query<dynamic>(
                "SP_GetActiveCustomerDebtAndUsageSummary",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get delinquent customers report
        /// </summary>
        public IEnumerable<dynamic> GetDelinquentCustomersReport()
        {
            return dbConnection.Query<dynamic>(
                "SP_GetDelinquentCustomersReport",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get customer account detail report for single concessioner
        /// </summary>
        public dynamic GetCustomerAccountDetailReport(int concessionerId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@ConcessionerID", concessionerId, DbType.Int32);

            return dbConnection.QuerySingleOrDefault<dynamic>(
                "SP_GetCustomerAccountDetailReport",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdateConcessioner(ConcessionerModel concessioner)
        {
            return Update(concessioner);
        }
    }
}
