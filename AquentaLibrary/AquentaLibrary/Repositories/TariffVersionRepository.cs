using System;
using System.Collections.Generic;
using System.Data;
using AquentaLibrary.Models;
using Dapper;

namespace AquentaLibrary.Repositories
{
    public class TariffVersionRepository : GenericRepository<TariffVersionModel>
    {
        public IEnumerable<TariffVersionModel> GetAllTariffVersions()
        {
            return dbConnection.Query<TariffVersionModel>(
                "SP_GetAllTariffVersion",
                commandType: CommandType.StoredProcedure);
        }

        public TariffVersionModel GetTariffVersionById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@TariffVersionID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<TariffVersionModel>(
                "SELECT TariffVersionID, VersionName, IsActive, CreatedAt FROM tbl_TariffVersion WHERE TariffVersionID = @TariffVersionID",
                parameters,
                commandType: CommandType.Text);
        }

        public TariffVersionModel GetActiveTariffVersion()
        {
            return dbConnection.QueryFirstOrDefault<TariffVersionModel>(
                "SP_GetActiveTariffVersion",
                commandType: CommandType.StoredProcedure);
        }

        public int CreateFromCurrentAndSetActive(string versionName)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@NewVersionName", versionName, DbType.String);

            return dbConnection.QuerySingle<int>(
                "SP_CreateTariffVersionFromCurrent",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public int SetActive(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@TariffVersionID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_SetActiveTariffVersion",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public int UpdateTariffVersionName(int id, string newName)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@TariffVersionID", id, DbType.Int32);
            parameters.Add("@NewName", newName, DbType.String);

            return dbConnection.Execute(
                "SP_UpdateTariffVersionName",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public int DeleteTariffVersionSP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@TariffVersionID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteTariffVersion",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
    }
}