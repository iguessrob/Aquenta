using System;
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

        public void SyncFaqs(IEnumerable<LandingPageFaqModel> faqs)
        {
            var orderedFaqs = (faqs ?? Enumerable.Empty<LandingPageFaqModel>())
                .Where(faq => faq != null)
                .Select((faq, index) => new LandingPageFaqModel
                {
                    LandingPageFaqID = faq.LandingPageFaqID,
                    Question = faq.Question,
                    Answer = faq.Answer,
                    SortOrder = index + 1
                })
                .ToList();

            using var db = CreateConnection();
            db.Open();
            using var tran = db.BeginTransaction();
            try
            {
                var existingFaqIds = db.Query<int>("SELECT LandingPageFaqID FROM dbo.tbl_LandingPageFaq", transaction: tran).ToHashSet();
                var incomingFaqIds = orderedFaqs.Where(faq => faq.LandingPageFaqID > 0).Select(faq => faq.LandingPageFaqID).ToHashSet();

                var idsToDelete = existingFaqIds.Except(incomingFaqIds).ToList();
                if (idsToDelete.Count > 0)
                {
                    db.Execute(
                        "DELETE FROM dbo.tbl_LandingPageFaq WHERE LandingPageFaqID IN @Ids",
                        new { Ids = idsToDelete },
                        transaction: tran);
                }

                foreach (var faq in orderedFaqs)
                {
                    if (faq.LandingPageFaqID > 0 && existingFaqIds.Contains(faq.LandingPageFaqID))
                    {
                        db.Execute(@"UPDATE dbo.tbl_LandingPageFaq
SET Question = @Question,
    Answer = @Answer,
    SortOrder = @SortOrder
WHERE LandingPageFaqID = @LandingPageFaqID;", faq, transaction: tran);
                    }
                    else
                    {
                        var newId = db.ExecuteScalar<int>(@"INSERT INTO dbo.tbl_LandingPageFaq (Question, Answer, SortOrder)
VALUES (@Question, @Answer, @SortOrder);
SELECT CAST(SCOPE_IDENTITY() AS int);", faq, transaction: tran);
                        faq.LandingPageFaqID = newId;
                    }
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
