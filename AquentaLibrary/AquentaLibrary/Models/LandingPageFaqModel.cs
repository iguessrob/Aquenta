using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AquentaLibrary.Models
{
    [Table("tbl_LandingPageFaq")]
    public class LandingPageFaqModel
    {
        [Key]
        public int LandingPageFaqID { get; set; }

        public string Question { get; set; }

        public string Answer { get; set; }

        public int SortOrder { get; set; }
    }
}
