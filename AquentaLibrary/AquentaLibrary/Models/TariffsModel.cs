using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_TariffRate")]
    public  class TariffsModel
    {
        [Key]
        public int RateId { get; set; }

        [Column("CategoryId")]
        public int CategoryId { get; set; }

        [Column("CubicMeter")]
        public decimal CubicMeter { get; set; }

        [Column("Amount")]
        public decimal Amount { get; set; }


    }
}
