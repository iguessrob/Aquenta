using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;

namespace AquentaLibrary.Repositories
{
    public static class SqlConnectionResolver
    {
        private static string _cachedConnectionString;
        private static readonly object _lock = new object();

        public static string GetWorkingConnectionString()
        {
            if (_cachedConnectionString != null) return _cachedConnectionString;

            lock (_lock)
            {
                if (_cachedConnectionString != null) return _cachedConnectionString;
                
                // We don't catch exceptions here, so if ResolveConnectionString fails,
                // it throws and doesn't set _cachedConnectionString, allowing retry on next call.
                _cachedConnectionString = ResolveConnectionString();
                return _cachedConnectionString;
            }
        }

        private static string ResolveConnectionString()
        {
            var candidates = new List<string>();

            var fromEnv = Environment.GetEnvironmentVariable("AQUENTA_SQL_CONNECTION");
            if (!string.IsNullOrWhiteSpace(fromEnv))
            {
                candidates.Add(EnsureResiliency(fromEnv));
            }

            candidates.Add(EnsureResiliency(@"Server=(localdb)\MSSQLLocalDB;Database=AquentaDB;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;"));
            candidates.Add(EnsureResiliency(@"Server=.\SQLEXPRESS;Database=AquentaDB;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;"));
            candidates.Add(EnsureResiliency(@"Server=localhost\SQLEXPRESS;Database=AquentaDB;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;"));

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

            var detailMessage = lastError != null ? $". Last Error: {lastError.Message}" : "";
            throw new InvalidOperationException(
                $"Unable to connect to AquentaDB. Set AQUENTA_SQL_CONNECTION to a valid SQL Server connection string or create AquentaDB in LocalDB/SQLEXPRESS{detailMessage}",
                lastError);
        }

        private static string EnsureResiliency(string connectionString)
        {
            try
            {
                var builder = new SqlConnectionStringBuilder(connectionString);
                
                // Azure SQL best practice: Enable connection resiliency
                // Connect Retry Count: Number of reconnections attempted after a transient failure (default 1)
                // Connect Retry Interval: Delay between reconnection attempts (default 10s)
                
                if (builder.ConnectRetryCount <= 1) builder.ConnectRetryCount = 3;
                if (builder.ConnectRetryInterval <= 0) builder.ConnectRetryInterval = 10;
                
                return builder.ConnectionString;
            }
            catch
            {
                return connectionString; // Return original if builder fails
            }
        }
    }
}
