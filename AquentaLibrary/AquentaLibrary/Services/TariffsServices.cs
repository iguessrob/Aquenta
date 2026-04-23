using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class TariffsServices
    {
        private TariffsRepository tariffsRepo = new TariffsRepository();

        public IEnumerable<TariffsModel> GetAll()
        {
            return tariffsRepo.GetAllTariffs();
        }

        public TariffsModel GetbyId(int id)
        {
            return tariffsRepo.GetTariffsById(id);
        }

        public bool Add(TariffsModel period)
        {
            return tariffsRepo.AddTariffs(period);
        }

        public bool Update(TariffsModel period)
        {
            return tariffsRepo.UpdateTariffs(period);
        }

        public bool Delete(int id)
        {
            return tariffsRepo.DeleteTariffs(id);
        }
    }
}
