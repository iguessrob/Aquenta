using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AquentaLibrary.Models
{
    [Table("tbl_LandingPageSettings")]
    public class LandingPageSettingsModel
    {
        [Key]
        public int LandingPageSettingsID { get; set; }

        public string OfficeName { get; set; }

        public string Address { get; set; }

        public string OfficeHours { get; set; }

        public string LandlineNumber { get; set; }

        public string EmailAddress { get; set; }

        public string GoogleMapsEmbedCode { get; set; }
    }
}
