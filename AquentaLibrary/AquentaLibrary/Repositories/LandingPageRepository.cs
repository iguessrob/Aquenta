using System.Collections.Generic;
using System.Data;
using System.Linq;
using AquentaLibrary.Models;
using Dapper;

namespace AquentaLibrary.Repositories
{
    public class LandingPageRepository
    {
        protected string ConnectionString => SqlConnectionResolver.GetWorkingConnectionString();

        protected IDbConnection CreateConnection()
        {
            return new Microsoft.Data.SqlClient.SqlConnection(ConnectionString);
        }

        public LandingPageSettingsModel GetSettings()
        {
            const string sql = "SELECT TOP 1 * FROM dbo.tbl_LandingPageSettings";
            using var db = CreateConnection();
            return db.QueryFirstOrDefault<LandingPageSettingsModel>(sql);
        }

        public IEnumerable<LandingPageFaqModel> GetFaqs()
        {
            const string sql = "SELECT * FROM dbo.tbl_LandingPageFaq ORDER BY SortOrder, LandingPageFaqID";
            using var db = CreateConnection();
            return db.Query<LandingPageFaqModel>(sql);
        }

        public bool UpsertSettings(LandingPageSettingsModel settings)
        {
            using var db = CreateConnection();
            var existing = db.QueryFirstOrDefault<int?>("SELECT TOP 1 LandingPageSettingsID FROM dbo.tbl_LandingPageSettings");
            if (existing == null)
            {
                const string insert = @"INSERT INTO dbo.tbl_LandingPageSettings
(OfficeName, Address, OfficeHours, LandlineNumber, EmailAddress, GoogleMapsEmbedCode)
VALUES (@OfficeName, @Address, @OfficeHours, @LandlineNumber, @EmailAddress, @GoogleMapsEmbedCode);";
                var rows = db.Execute(insert, settings);
                return rows >= 1;
            }

            const string update = @"UPDATE dbo.tbl_LandingPageSettings SET
OfficeName = @OfficeName,
Address = @Address,
OfficeHours = @OfficeHours,
LandlineNumber = @LandlineNumber,
EmailAddress = @EmailAddress,
GoogleMapsEmbedCode = @GoogleMapsEmbedCode";
            var affected = db.Execute(update, settings);
            return affected >= 1;
        }

        public void ReplaceFaqs(IEnumerable<LandingPageFaqModel> faqs)
        {
            using var db = CreateConnection();
            using var tran = db.BeginTransaction();
            try
            {
                db.Execute("DELETE FROM dbo.tbl_LandingPageFaq", transaction: tran);

                const string insert = @"INSERT INTO dbo.tbl_LandingPageFaq (Question, Answer, SortOrder)
VALUES (@Question, @Answer, @SortOrder);";

                int order = 1;
                foreach (var f in faqs.OrderBy(f => f.SortOrder))
                {
                    var param = new { Question = f.Question, Answer = f.Answer, SortOrder = order };
                    db.Execute(insert, param, transaction: tran);
                    order++;
                }

                tran.Commit();
            }
            catch
            {
                tran.Rollback();
                throw;
            }
        }
    }
}
