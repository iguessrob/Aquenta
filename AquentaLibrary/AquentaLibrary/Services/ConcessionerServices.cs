using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class ConcessionerServices
    {
        private ConcessionerRepository concessionerRepo = new ConcessionerRepository();

        public IEnumerable<ConcessionerModel> GetAll()
        {
            return concessionerRepo.GetAllConcessioner();
        }

        public IEnumerable<ConcessionerModel> GetAllActive()
        {
            return concessionerRepo.GetAllActiveConcessioner();
        }

        public ConcessionerModel GetbyId(int id)
        {
            return concessionerRepo.GetConcessionerById(id);
        }

        public bool Add(ConcessionerModel concessioner)
        {
            return concessionerRepo.AddConcessioner(concessioner);
        }

        public bool Update(ConcessionerModel concessioner)
        {
            return concessionerRepo.UpdateConcessioner(concessioner);
        }

        public bool Delete(int id)
        {
            return concessionerRepo.DeleteConcessioner(id);
        }

        // Service wrapper for stored procedure
        public int GetTotalActiveConcessioners(string status)
        {
            return concessionerRepo.GetTotalActiveConcessioners(status);
        }

        public ConcessionerModel GetByUserId(int userId)
        {
            var concessioners = concessionerRepo.GetConcessionerByUserId(userId);
            return concessioners.FirstOrDefault();
        }
    }
}
