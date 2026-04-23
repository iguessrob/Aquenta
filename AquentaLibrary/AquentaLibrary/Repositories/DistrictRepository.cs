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
    public class DistrictRepository : GenericRepository<DistrictModel>
    {
        public bool AddDistrict(DistrictModel district)
        {
            return Add(district);
        }

        public bool DeleteDistrict(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all districts using SP_GetAllDistrict
        /// </summary>
        public IEnumerable<DistrictModel> GetAllDistrict()
        {
            return dbConnection.Query<DistrictModel>(
                "SP_GetAllDistrict",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get district by ID using SP_GetDistrictById
        /// </summary>
        public DistrictModel GetDistrictById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@DistrictID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<DistrictModel>(
                "SP_GetDistrictById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert district using SP_InsertDistrict
        /// </summary>
        public int InsertDistrict(DistrictModel district)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@DistrictName", district.DistrictName, DbType.String);

            return dbConnection.QuerySingle<int>(
                "SP_InsertDistrict",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update district using SP_UpdateDistrict
        /// </summary>
        public int UpdateDistrictSP(DistrictModel district)
        {
            var parameters = new DynamicParameters();
                parameters.Add("@DistrictID", district.DistrictId, DbType.Int32);
            parameters.Add("@DistrictName", district.DistrictName, DbType.String);

            return dbConnection.Execute(
                "SP_UpdateDistrict",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Delete district using SP_DeleteDistrict
        /// </summary>
        public int DeleteDistrictSP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@DistrictID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteDistrict",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdateDistrict(DistrictModel district)
        {
            return Update(district);
        }

    }
}
