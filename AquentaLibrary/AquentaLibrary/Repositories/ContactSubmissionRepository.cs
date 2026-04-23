using System;
using System.Collections.Generic;
using System.Data;
using AquentaLibrary.Models;
using Dapper;

namespace AquentaLibrary.Repositories
{
    public class ContactSubmissionRepository : GenericRepository<ContactSubmissionModel>
    {
        public IEnumerable<ContactSubmissionModel> GetAllContactSubmissions()
        {
            return GetAll();
        }

        public ContactSubmissionModel? GetContactSubmissionById(int id)
        {
            return GetbyId(id);
        }

        public int InsertContactSubmission(ContactSubmissionModel submission)
        {
            const string sql = @"INSERT INTO tbl_ContactSubmission
(FullName, AccountNumber, ContactNumber, Email, Subject, Message, SubmittedAt, Status)
VALUES
(@FullName, @AccountNumber, @ContactNumber, @Email, @Subject, @Message, @SubmittedAt, @Status);
SELECT CAST(SCOPE_IDENTITY() as int);";

            return dbConnection.QuerySingle<int>(sql, submission, commandType: CommandType.Text);
        }
    }
}
