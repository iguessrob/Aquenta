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
                "SP_GetTariffVersionById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public TariffVersionModel GetActiveTariffVersion()
        {
            return dbConnection.QueryFirstOrDefault<TariffVersionModel>(
                "SP_GetActiveTariffVersion",
                commandType: CommandType.StoredProcedure);
        }

        public int InsertTariffVersion(TariffVersionModel tariffVersion)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@VersionName", tariffVersion.VersionName, DbType.String);
            parameters.Add("@IsActive", tariffVersion.IsActive, DbType.Boolean);

            return dbConnection.QuerySingle<int>(
                "SP_InsertTariffVersion",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

            public int CreateFromCurrentAndSetActive(string versionName)
            {
                var parameters = new DynamicParameters();
                parameters.Add("@VersionName", versionName, DbType.String);

                return dbConnection.QuerySingle<int>(
                "SP_CreateTariffVersionFromCurrent",
                parameters,
                commandType: CommandType.StoredProcedure);
            }

        public int UpdateTariffVersionSP(TariffVersionModel tariffVersion)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@TariffVersionID", tariffVersion.TariffVersionId, DbType.Int32);
            parameters.Add("@VersionName", tariffVersion.VersionName, DbType.String);
            parameters.Add("@IsActive", tariffVersion.IsActive, DbType.Boolean);

            return dbConnection.Execute(
                "SP_UpdateTariffVersion",
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