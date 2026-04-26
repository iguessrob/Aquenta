using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AquentaLibrary.Models
{
    [Table("tbl_TariffVersion")]
    public class TariffVersionModel
    {
        [Key]
        public int TariffVersionId { get; set; }

        [Column("VersionName")]
        public string VersionName { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }
    }
}