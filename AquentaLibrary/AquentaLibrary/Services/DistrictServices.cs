using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class DistrictServices
    {
        private DistrictRepository districtRepo = new DistrictRepository();

        public IEnumerable<DistrictModel> GetAll()
        {
            return districtRepo.GetAllDistrict();
        }

        public DistrictModel GetbyId(int id)
        {
            return districtRepo.GetDistrictById(id);
        }

        public bool Add(DistrictModel district)
        {
            return districtRepo.AddDistrict(district);
        }

        public bool Update(DistrictModel district)
        {
            return districtRepo.UpdateDistrict(district);
        }

        public bool Delete(int id)
        {
            return districtRepo.DeleteDistrict(id);
        }
    }
}
