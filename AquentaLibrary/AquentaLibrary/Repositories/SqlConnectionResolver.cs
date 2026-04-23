using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;

namespace AquentaLibrary.Repositories
{
    internal static class SqlConnectionResolver
    {
        private static readonly Lazy<string> CachedConnectionString = new Lazy<string>(ResolveConnectionString);

        public static string GetWorkingConnectionString()
        {
            return CachedConnectionString.Value;
        }

        private static string ResolveConnectionString()
        {
            var candidates = new List<string>();

            var fromEnv = Environment.GetEnvironmentVariable("AQUENTA_SQL_CONNECTION");
            if (!string.IsNullOrWhiteSpace(fromEnv))
            {
                candidates.Add(fromEnv);
            }

            candidates.Add(@"Server=(localdb)\MSSQLLocalDB;Database=AquentaDB;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;");
            candidates.Add(@"Server=.\SQLEXPRESS;Database=AquentaDB;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;");
            candidates.Add(@"Server=localhost\SQLEXPRESS;Database=AquentaDB;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;");

            Exception lastError = null;

            foreach (var connectionString in candidates)
            {
                try
                {
                    using var connection = new SqlConnection(connectionString);
                    connection.Open();

                    using var command = new SqlCommand("SELECT 1", connection);
                    command.ExecuteScalar();

                    return connectionString;
                }
                catch (Exception ex)
                {
                    lastError = ex;
                }
            }

            throw new InvalidOperationException(
                "Unable to connect to AquentaDB. Set AQUENTA_SQL_CONNECTION to a valid SQL Server connection string or create AquentaDB in LocalDB/SQLEXPRESS.",
                lastError);
        }
    }
}
