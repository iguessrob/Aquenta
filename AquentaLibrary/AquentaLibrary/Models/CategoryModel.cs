using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    [Table("tbl_Category")]
    public class CategoryModel
    {
        [Key]
        public int CategoryId { get; set; }

        [Column("CategoryName")]
        public string CategoryName { get; set; }
    }
}
