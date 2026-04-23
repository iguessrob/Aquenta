using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_Payment")]
    public class PaymentModel
    {
        [Key]
        public int PaymentId { get; set; }

        [Column("BillingId")]
        public int BillingId { get; set; }

        [Column("AmountPaid")]
        public decimal AmountPaid { get; set; }

        [Column("DatePaid")]
        public DateTime DatePaid { get; set; }

        [NotMapped]
        public decimal BillAmount { get; set; }

        [NotMapped]
        public decimal Penalty { get; set; }

        [NotMapped]
        public DateTime PeriodStart { get; set; }

        [NotMapped]
        public DateTime PeriodEnd { get; set; }

        [NotMapped]
        public int ConcessionerID { get; set; }

        [NotMapped]
        public string BillStatus { get; set; }

        [NotMapped]
        public decimal Arrears { get; set; }
    }
}
