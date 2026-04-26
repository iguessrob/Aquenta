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
        public IEnumerable<TariffsModel> GetAllTariffs()
        {
            return dbConnection.Query<TariffsModel>(
                "SELECT RateID, CategoryID, TariffVersionID, CubicMeter, Amount FROM tbl_TariffRate",
                commandType: CommandType.Text);
        }

        public TariffsModel GetTariffsById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@RateID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<TariffsModel>(
                "SELECT RateID, CategoryID, TariffVersionID, CubicMeter, Amount FROM tbl_TariffRate WHERE RateID = @RateID",
                parameters,
                commandType: CommandType.Text);
        }

        public IEnumerable<TariffsModel> GetTariffsByCategoryId(int categoryId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@CategoryID", categoryId, DbType.Int32);

            return dbConnection.Query<TariffsModel>(
                "SELECT RateID, CategoryID, TariffVersionID, CubicMeter, Amount FROM tbl_TariffRate WHERE CategoryID = @CategoryID",
                parameters,
                commandType: CommandType.Text);
        }

        public IEnumerable<TariffsModel> GetTariffsByVersionId(int tariffVersionId)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@TariffVersionID", tariffVersionId, DbType.Int32);

            return dbConnection.Query<TariffsModel>(
                "SP_GetTariffRateByVersionId",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool AddTariffs(TariffsModel tariff)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@CategoryID", tariff.CategoryId, DbType.Int32);
            parameters.Add("@TariffVersionID", tariff.TariffVersionId, DbType.Int32);
            parameters.Add("@CubicMeter", tariff.CubicMeter, DbType.Double);
            parameters.Add("@Amount", tariff.Amount, DbType.Double);

            var result = dbConnection.Execute(
                "INSERT INTO tbl_TariffRate (CategoryID, TariffVersionID, CubicMeter, Amount) VALUES (@CategoryID, @TariffVersionID, @CubicMeter, @Amount)",
                parameters,
                commandType: CommandType.Text);

            return result > 0;
        }

        public bool UpdateTariffs(TariffsModel tariff)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@RateID", tariff.RateId, DbType.Int32);
            parameters.Add("@CategoryID", tariff.CategoryId, DbType.Int32);
            parameters.Add("@TariffVersionID", tariff.TariffVersionId, DbType.Int32);
            parameters.Add("@CubicMeter", tariff.CubicMeter, DbType.Double);
            parameters.Add("@Amount", tariff.Amount, DbType.Double);

            var result = dbConnection.Execute(
                "UPDATE tbl_TariffRate SET CategoryID = @CategoryID, TariffVersionID = @TariffVersionID, CubicMeter = @CubicMeter, Amount = @Amount WHERE RateID = @RateID",
                parameters,
                commandType: CommandType.Text);

            return result > 0;
        }

        public bool DeleteTariffs(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@RateID", id, DbType.Int32);

            var result = dbConnection.Execute(
                "DELETE FROM tbl_TariffRate WHERE RateID = @RateID",
                parameters,
                commandType: CommandType.Text);

            return result > 0;
        }
    }
}
