using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_Period")]
    public class PeriodModel
    {
        [Key]
        public int PeriodId { get; set; }

        [Column("PeriodStart")]
        public DateTime PeriodStart { get; set; }

        [Column("PeriodEnd")]
        public DateTime PeriodEnd { get; set; }
    }
}
