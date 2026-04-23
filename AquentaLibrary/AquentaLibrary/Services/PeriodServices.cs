using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class PeriodServices
    {
        private PeriodRepository periodRepo = new PeriodRepository();

        public IEnumerable<PeriodModel> GetAll()
        {
            return periodRepo.GetAllPeriod();
        }

        public PeriodModel GetbyId(int id)
        {
            return periodRepo.GetPeriodById(id);
        }

        public bool Add(PeriodModel period)
        {
            return periodRepo.AddPeriod(period);
        }

        public bool Update(PeriodModel period)
        {
            return periodRepo.UpdatePeriod(period);
        }

        public bool Delete(int id)
        {
            return periodRepo.DeletePeriod(id);
        }
    }
}
