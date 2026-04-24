using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;
using System.Linq;
using System.Reflection;
using Dapper;
using Microsoft.Data.SqlClient;

namespace AquentaLibrary.Repositories
{       
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        protected string ConnectionString => SqlConnectionResolver.GetWorkingConnectionString();

        protected IDbConnection CreateConnection()
        {
            return new SqlConnection(ConnectionString);
        }

        /// <summary>
        /// Gets a fresh connection. Note: For complex operations, use CreateConnection() with a 'using' block.
        /// For simple Dapper calls, Dapper will automatically open and close this connection.
        /// </summary>
        protected IDbConnection dbConnection => CreateConnection();

        public GenericRepository()
        {
        }

        // READ

        public IEnumerable<T> GetAll()
        {
            string tableName = GetTableName();
            string query = $"SELECT * FROM {tableName}";

            using var dbConnection = CreateConnection();
            return dbConnection.Query<T>(query);
        }

        public T GetbyId(int id)
        {
            string tableName = GetTableName();
            var keyProp = GetKeyPropertyInfo();
            var keyColumn = GetColumnName(keyProp); // actual DB column (bracketed)
            var paramName = keyProp?.Name ?? "Id"; // CLR property name used for parameter

            string query = $"SELECT * FROM {tableName} WHERE {keyColumn} = @{paramName}";

            var parameters = new DynamicParameters();
            parameters.Add(paramName, id);

            using var dbConnection = CreateConnection();
            return dbConnection.QueryFirstOrDefault<T>(query, parameters);
        }

        // CREATE

        public bool Add(T Entity)
        {
            string tableName = GetTableName();
            string columns = GetColumnNames();
            string values = GetColumnValues();

            string query = $"INSERT INTO {tableName} ({columns}) VALUES ({values})";

            using var dbConnection = CreateConnection();
            int affectedRow = dbConnection.Execute(query, Entity);
            return affectedRow == 1;
        }

        // UPDATE

        public bool Update(T Entity)
        {
            string tableName = GetTableName();
            var keyProp = GetKeyPropertyInfo();
            string setClause = GetSetClause(keyProp);
            var keyColumn = GetColumnName(keyProp);
            var paramName = keyProp?.Name ?? "Id";

            string query = $"UPDATE {tableName} SET {setClause} WHERE {keyColumn} = @{paramName}";

            using var dbConnection = CreateConnection();
            int affectedRow = dbConnection.Execute(query, Entity);
            return affectedRow == 1;
        }

        private string GetSetClause(PropertyInfo keyProp)
        {
            var properties = typeof(T).GetProperties()
                .Where(p => p != keyProp && p.GetCustomAttribute<NotMappedAttribute>() == null);

            var setClause = string.Join(", ", properties.Select(p =>
            {
                var columnAttr = p.GetCustomAttribute<ColumnAttribute>();
                var columnName = columnAttr != null ? columnAttr.Name : p.Name;
                return $"[{columnName}] = @{p.Name}";
            }));
            return setClause;
        }

        public bool Delete(int id)
        {
            string tableName = GetTableName();
            var keyProp = GetKeyPropertyInfo();
            var keyColumn = GetColumnName(keyProp);
            var paramName = keyProp?.Name ?? "Id";

            string query = $"DELETE FROM {tableName} WHERE {keyColumn} = @{paramName}";

            var parameters = new DynamicParameters();
            parameters.Add(paramName, id);

            using var dbConnection = CreateConnection();
            int affectedRow = dbConnection.Execute(query, parameters);
            return affectedRow == 1;
        }

        public string GetTableName()
        {
            var type = typeof(T);
            var tableAttr = type.GetCustomAttribute<TableAttribute>();
            var tableName = tableAttr != null ? tableAttr.Name : type.Name;
            return $"[{tableName}]";
        }

        public string GetColumnNames(bool excludeKey = true)
        {
            var type = typeof(T);
            var keyProp = GetKeyPropertyInfo();
            var columns = string.Join(", ", type.GetProperties()
                .Where(p => (!excludeKey || p != keyProp) && p.GetCustomAttribute<NotMappedAttribute>() == null)
                .Select(p =>
                {
                    var columnAttr = p.GetCustomAttribute<ColumnAttribute>();
                    var name = columnAttr != null ? columnAttr.Name : p.Name;
                    return $"[{name}]";
                }));
            return columns;
        }

        public string GetColumnValues(bool excludeKey = true)
        {
            var keyProp = GetKeyPropertyInfo();
            var columnValues = typeof(T).GetProperties()
                .Where(p => (!excludeKey || p != keyProp) && p.GetCustomAttribute<NotMappedAttribute>() == null);
            var values = string.Join(",", columnValues.Select(p =>
            {
                return $"@{p.Name}";
            }));

            return values;
        }

        private PropertyInfo GetKeyPropertyInfo()
        {
            var props = typeof(T).GetProperties();

            // Prefer explicit [Key]
            var keyProp = props.FirstOrDefault(p => p.GetCustomAttribute<KeyAttribute>() != null);
            if (keyProp != null)
                return keyProp;

            // Fallback to common naming: Id, <TypeName>Id, UserId, etc.
            keyProp = props.FirstOrDefault(p => string.Equals(p.Name, "Id", StringComparison.OrdinalIgnoreCase))
                ?? props.FirstOrDefault(p => p.Name.EndsWith("Id", StringComparison.OrdinalIgnoreCase));

            return keyProp;
        }

        private string GetColumnName(PropertyInfo prop)
        {
            if (prop == null)
                return "[Id]";

            var columnAttr = prop.GetCustomAttribute<ColumnAttribute>();
            var name = columnAttr != null ? columnAttr.Name : prop.Name;
            return $"[{name}]";
        }
        public int GetTotalActiveConcessioners(string status)
        {
            // use named parameter "Status" to match the stored procedure parameter
            var parameters = new DynamicParameters();
            parameters.Add("Status", status, DbType.String, size: 50);

            // The stored procedure returns a single row with one column (TotalActiveConcessioners).
            // QuerySingle<int> will map the first column of the single row to int.
            using var dbConnection = CreateConnection();
            return dbConnection.QuerySingle<int>(
                "dbo.SP_ShowTotalActiveConcessioners",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

    }
}
