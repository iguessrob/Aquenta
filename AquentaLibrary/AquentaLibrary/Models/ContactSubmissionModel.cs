using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AquentaLibrary.Models
{
    [Table("tbl_ContactSubmission")]
    public class ContactSubmissionModel
    {
        [Key]
        public int ContactSubmissionId { get; set; }

        [Column("FullName")]
        public string? FullName { get; set; }

        [Column("AccountNumber")]
        public string? AccountNumber { get; set; }

        [Column("ContactNumber")]
        public string? ContactNumber { get; set; }

        [Column("Email")]
        public string? Email { get; set; }

        [Column("Subject")]
        public string? Subject { get; set; }

        [Column("Message")]
        public string? Message { get; set; }

        [Column("SubmittedAt")]
        public DateTime SubmittedAt { get; set; }

        [Column("Status")]
        public string? Status { get; set; }
    }
}
