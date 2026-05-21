using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_Billing")]
    public class BillingModel
    {
        [Key]
        public int BillingId { get; set; }

        [Column("ConcessionerID")]
        public int ConcessionerID { get; set; }

        [Column("UserId")]
        public int UserId { get; set; }

        [Column("PeriodId")]
        public int PeriodId { get; set; }

        [Column("PrevReading")]
        public int PrevReading { get; set; }

        [Column("CurrentReading")]
        public int CurrentReading { get; set; }

        [Column("BillAmount")]
        public decimal BillAmount { get; set; }

        [Column("Penalty")]
        public decimal Penalty { get; set; }

        [Column("BillStatus")]
        public string BillStatus { get; set; }
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        [NotMapped]
        public DateTime PeriodStart { get; set; }

        [NotMapped]
        public DateTime PeriodEnd { get; set; }

        [NotMapped]
        public string DisplayStatus
        {
            get
            {
                if (string.Equals(BillStatus, "Paid", StringComparison.OrdinalIgnoreCase))
                {
                    return "Paid";
                }

                // Determine reference billing date
                DateTime billingDate = (PeriodEnd != default(DateTime) && PeriodEnd.Year > 1900) ? PeriodEnd : CreatedAt;
                if (billingDate == default(DateTime) || billingDate.Year <= 1900)
                {
                    billingDate = DateTime.Now;
                }

                // 20th of the following month
                int nextMonth = billingDate.Month + 1;
                int nextYear = billingDate.Year;
                if (nextMonth > 12)
                {
                    nextMonth = 1;
                    nextYear += 1;
                }

                DateTime thresholdDate = new DateTime(nextYear, nextMonth, 20, 0, 0, 0, DateTimeKind.Unspecified);

                if (DateTime.Now < thresholdDate)
                {
                    return "Pending";
                }
                else
                {
                    return "Unpaid";
                }
            }
            set
            {
                // Setter required for serialization/deserialization or mapping compatibility
            }
        }
    }
}
