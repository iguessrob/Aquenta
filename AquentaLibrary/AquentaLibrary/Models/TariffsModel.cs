using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    public class TariffsModel
    {
        public int RateId { get; set; }
        public int CategoryId { get; set; }
        public int TariffVersionId { get; set; }
        public double CubicMeter { get; set; }
        public double Amount { get; set; }
    }
}
