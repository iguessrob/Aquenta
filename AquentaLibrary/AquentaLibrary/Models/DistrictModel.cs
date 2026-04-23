using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_District")]
    public class DistrictModel
    {
        [Key]
        public int DistrictId { get; set; }

        [Column("DistrictName")]
        public string DistrictName { get; set; }
    }
}

    
