using System;
using System.Collections.Generic;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class ContactSubmissionServices
    {
        private readonly ContactSubmissionRepository _contactSubmissionRepository = new ContactSubmissionRepository();

        public IEnumerable<ContactSubmissionModel> GetAll()
        {
            return _contactSubmissionRepository.GetAllContactSubmissions();
        }

        public ContactSubmissionModel? GetById(int id)
        {
            return _contactSubmissionRepository.GetContactSubmissionById(id);
        }

        public int Submit(ContactSubmissionModel submission)
        {
            submission.FullName = submission.FullName?.Trim();
            submission.AccountNumber = string.IsNullOrWhiteSpace(submission.AccountNumber) ? null : submission.AccountNumber.Trim();
            submission.ContactNumber = submission.ContactNumber?.Trim();
            submission.Email = submission.Email?.Trim();
            submission.Subject = submission.Subject?.Trim();
            submission.Message = submission.Message?.Trim();
            submission.SubmittedAt = DateTime.UtcNow;
            submission.Status = "New";

            return _contactSubmissionRepository.InsertContactSubmission(submission);
        }
    }
}
