using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using Dapper;
using AquentaLibrary.Models;
using System.Linq;

namespace DebugScript
{
    class Program
    {
        static void Main(string[] args)
        {
            string connectionString = "Server=localhost\\SQLEXPRESS;Database=AquentaDB;Trusted_Connection=True;";
            using (var db = new SqlConnection(connectionString))
            {
                var activeVersion = db.QueryFirstOrDefault<TariffVersionModel>(
                    "SELECT TOP 1 * FROM tbl_TariffVersion WHERE IsActive = 1 ORDER BY CreatedAt DESC, TariffVersionID DESC");
                
                if (activeVersion == null)
                {
                    Console.WriteLine("No active version found.");
                    return;
                }

                Console.WriteLine($"Active Version: {activeVersion.VersionName} (ID: {activeVersion.TariffVersionId})");

                var rates = db.Query<TariffsModel>(
                    "SELECT * FROM tbl_TariffRate WHERE TariffVersionID = @Id", 
                    new { Id = activeVersion.TariffVersionId }).ToList();

                Console.WriteLine($"Found {rates.Count} rates for this version.");
                foreach (var rate in rates)
                {
                    Console.WriteLine($"Category: {rate.CategoryId}, CubicMeter: {rate.CubicMeter}, Amount: {rate.Amount}");
                }
            }
        }
    }
}
