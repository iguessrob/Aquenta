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
    }
}
