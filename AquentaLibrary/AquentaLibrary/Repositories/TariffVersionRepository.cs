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

        public TariffVersionModel GetTariffVersionByName(string versionName)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@VersionName", versionName, DbType.String);

            return dbConnection.QueryFirstOrDefault<TariffVersionModel>(
                "SELECT DISTINCT VersionName, IsActive FROM tbl_TariffRate WHERE VersionName = @VersionName",
                parameters,
                commandType: CommandType.Text);
        }

        public TariffVersionModel GetActiveTariffVersion()
        {
            return dbConnection.QueryFirstOrDefault<TariffVersionModel>(
                "SP_GetActiveTariffVersion",
                commandType: CommandType.StoredProcedure);
        }

        public string InsertTariffVersion(TariffVersionModel tariffVersion)
        {
            // Note: In single table mode, inserting a version means creating a new preset with rates.
            // This is usually handled via SP_CreateTariffVersionFromCurrent.
            // If we just want to track a name, we'd need at least one rate row.
            return tariffVersion.VersionName;
        }

            public string CreateFromCurrentAndSetActive(string versionName)
            {
                var parameters = new DynamicParameters();
                parameters.Add("@NewVersionName", versionName, DbType.String);

                return dbConnection.QuerySingle<string>(
                "SP_CreateTariffVersionFromCurrent",
                parameters,
                commandType: CommandType.StoredProcedure);
            }

        public int UpdateTariffVersionName(string oldName, string newName)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@OldName", oldName, DbType.String);
            parameters.Add("@NewName", newName, DbType.String);

            return dbConnection.Execute(
                "SP_UpdateTariffVersionName",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public int DeleteTariffVersionSP(string versionName)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@VersionName", versionName, DbType.String);

            return dbConnection.Execute(
                "SP_DeleteTariffVersion",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public int SetActive(string versionName)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@VersionName", versionName, DbType.String);

            return dbConnection.Execute(
                "SP_SetActiveTariffVersion",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
    }
}