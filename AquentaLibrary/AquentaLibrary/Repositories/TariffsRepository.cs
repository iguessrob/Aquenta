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
    public class TariffsRepository : GenericRepository<TariffsModel>
    {
        public bool AddTariffs(TariffsModel tariff)
        {
            return Add(tariff);
        }

        public bool DeleteTariffs(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all tariffs using SP_GetAllTariffRate
        /// </summary>
        public IEnumerable<TariffsModel> GetAllTariffs()
        {
            return dbConnection.Query<TariffsModel>(
                "SP_GetAllTariffRate",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get tariff by ID using SP_GetTariffRateById
        /// </summary>
        public TariffsModel GetTariffsById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@RateID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<TariffsModel>(
                "SP_GetTariffRateById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get tariffs by category ID using SP_GetTariffRateByCategoryId
        /// </summary>
        public IEnumerable<TariffsModel> GetTariffsByCategoryId(int categoryId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@CategoryID", categoryId, DbType.Int32);

            return dbConnection.Query<TariffsModel>(
                "SP_GetTariffRateByCategoryId",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get tariffs by version name using SP_GetTariffRateByVersionName
        /// </summary>
        public IEnumerable<TariffsModel> GetTariffsByVersionName(string versionName)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@VersionName", versionName, DbType.String);

            return dbConnection.Query<TariffsModel>(
                "SP_GetTariffRateByVersionName",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert tariff using SP_InsertTariffRate
        /// </summary>
        public int InsertTariffs(TariffsModel tariff)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@CategoryId", tariff.CategoryId, DbType.Int32);
            parameters.Add("@VersionName", tariff.VersionName, DbType.String);
            parameters.Add("@IsActive", tariff.IsActive, DbType.Boolean);
            parameters.Add("@CubicMeter", tariff.CubicMeter, DbType.Decimal);
            parameters.Add("@Amount", tariff.Amount, DbType.Decimal);

            return dbConnection.QuerySingle<int>(
                "SP_InsertTariffRate",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update tariff using SP_UpdateTariffRate
        /// </summary>
        public int UpdateTariffsSP(TariffsModel tariff)
        {
            var parameters = new DynamicParameters();
                parameters.Add("@RateId", tariff.RateId, DbType.Int32);
                parameters.Add("@CategoryId", tariff.CategoryId, DbType.Int32);
            parameters.Add("@VersionName", tariff.VersionName, DbType.String);
            parameters.Add("@IsActive", tariff.IsActive, DbType.Boolean);
            parameters.Add("@CubicMeter", tariff.CubicMeter, DbType.Decimal);
            parameters.Add("@Amount", tariff.Amount, DbType.Decimal);

            return dbConnection.Execute(
                "SP_UpdateTariffRate",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Delete tariff using SP_DeleteTariffRate
        /// </summary>
        public int DeleteTariffsSP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@RateID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteTariffRate",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdateTariffs(TariffsModel tariffs)
        {
            return Update(tariffs);
        }
    }
}
