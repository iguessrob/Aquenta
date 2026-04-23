using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class BillingServices
    {
        private BillingRepository billingRepo = new BillingRepository();

        public IEnumerable<BillingModel> GetAll()
        {
            return billingRepo.GetAllBilling();
        }

        public BillingModel GetbyId(int id)
        {
            return billingRepo.GetBillingById(id);
        }

        public bool Add(BillingModel billing)
        {
            return billingRepo.AddBilling(billing);
        }

        public bool Update(BillingModel billing)
        {
            return billingRepo.UpdateBilling(billing);
        }
        
        public bool Delete(int id)
        {
            return billingRepo.DeleteBilling(id);
        }

        public int GetMonthlyWaterConsumption(DateTime startDate, DateTime endDate)
        {
            return billingRepo.GetMonthlyWaterConsumption(startDate, endDate);
        }

        public int GetLatestMonthWaterConsumption()
        {
            return billingRepo.GetLatestMonthWaterConsumption();
        }

        public IEnumerable<BillingModel> GetByConcessionerId(int concessionerId)
        {
            return billingRepo.GetBillingByConcessionerId(concessionerId);
        }
    }
}
