using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AquentaLibrary.Models
{
    public class DistributePaymentRequest
    {
        public int ConcessionerID { get; set; }
        public decimal AmountPaid { get; set; }
        public int CurrentBillingID { get; set; }
    }

    public class ReverseDistributionRequest
    {
        public int ConcessionerID { get; set; }
    }
}
