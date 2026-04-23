using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_User")]
    public class UserModel
    {
        [Key]
        public int UserId { get; set; }

        [Column("Username")]
        public string? UserName { get; set; }

        [Column("Pass")]
        public string? Pass { get; set; }

        [Column("FirstName")]
        public string? FirstName { get; set; }

        [Column("LastName")]
        public string? LastName { get; set; }

        [Column("UserRole")]
        public string? UserRole { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        [Column("IsDeleted")]
        public bool IsDeleted { get; set; }
    }
}
