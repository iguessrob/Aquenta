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
    public class PeriodRepository : GenericRepository<PeriodModel>
    {
        public bool AddPeriod(PeriodModel period)
        {
            return Add(period);
        }

        public bool DeletePeriod(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all periods using SP_GetAllPeriod
        /// </summary>
        public IEnumerable<PeriodModel> GetAllPeriod()
        {
            return dbConnection.Query<PeriodModel>(
                "SP_GetAllPeriod",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get period by ID using SP_GetPeriodById
        /// </summary>
        public PeriodModel GetPeriodById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@PeriodID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<PeriodModel>(
                "SP_GetPeriodById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get latest period using SP_GetLatestPeriod
        /// </summary>
        public PeriodModel GetLatestPeriod()
        {
            return dbConnection.QueryFirstOrDefault<PeriodModel>(
                "SP_GetLatestPeriod",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert period using SP_InsertPeriod
        /// </summary>
        public int InsertPeriod(PeriodModel period)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@PeriodStart", period.PeriodStart, DbType.DateTime);
            parameters.Add("@PeriodEnd", period.PeriodEnd, DbType.DateTime);

            return dbConnection.QuerySingle<int>(
                "SP_InsertPeriod",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update period using SP_UpdatePeriod
        /// </summary>
        public int UpdatePeriodSP(PeriodModel period)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@PeriodId", period.PeriodId, DbType.Int32);
            parameters.Add("@PeriodStart", period.PeriodStart, DbType.DateTime);
            parameters.Add("@PeriodEnd", period.PeriodEnd, DbType.DateTime);

            return dbConnection.Execute(
                "SP_UpdatePeriod",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Delete period using SP_DeletePeriod
        /// </summary>
        public int DeletePeriodSP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@PeriodID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeletePeriod",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdatePeriod(PeriodModel period)
        {
            return Update(period);
        }
    }
}
