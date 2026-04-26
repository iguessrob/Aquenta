using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_Concessioner")]
    public class ConcessionerModel
    {
        [Key]
        public int ConcessionerId { get; set; }

        [Column("UserId")]
        public int UserId { get; set; }

        [Column("CategoryId")]
        public int CategoryId { get; set; }

        [Column("MembershipId")]
        public int MembershipId { get; set; }

        [Column("DistrictID")]
        public int DistrictId { get; set; }

        [Column("AccountNumber")]
        public string AccountNumber { get; set; }

        [Column("AccountOrder")]
        public int AccountOrder { get; set; }

        [Column("MeterNumber")]
        public string MeterNumber { get; set; }

        [Column("Address")]
        public string Address { get; set; }

        [Column("ContactNumber")]
        public string ContactNumber { get; set; }

        [Column("EmailAddress")]
        public string EmailAddress { get; set; }

        [Column("Status")]
        public string Status { get; set; }

        [Column("IsDeleted")]
        public bool IsDeleted { get; set; }
    }
}
