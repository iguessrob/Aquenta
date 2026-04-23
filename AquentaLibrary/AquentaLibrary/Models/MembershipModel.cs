using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_Membership")]
    public class MembershipModel
    {
        [Key]
        public int MembershipId { get; set; }

        [Column("MembershipName")]
        public string MembershipName { get; set; }

        [Column("DiscountRate")]
        public decimal DiscountRate { get; set; }
    }
}
