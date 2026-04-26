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
        private TariffVersionServices tariffVersionServices = new TariffVersionServices();

        public IEnumerable<TariffsModel> GetAll()
        {
            return tariffsRepo.GetAllTariffs();
        }

        public TariffsModel GetbyId(int id)
        {
            return tariffsRepo.GetTariffsById(id);
        }

        public IEnumerable<TariffsModel> GetByCategoryId(int categoryId)
        {
            return tariffsRepo.GetTariffsByCategoryId(categoryId);
        }

        public bool Add(TariffsModel period)
        {
            EnsureTariffVersion(period);
            return tariffsRepo.AddTariffs(period);
        }

        public bool Update(TariffsModel period)
        {
            EnsureTariffVersion(period);
            return tariffsRepo.UpdateTariffs(period);
        }

        public bool Delete(int id)
        {
            return tariffsRepo.DeleteTariffs(id);
        }

        public IEnumerable<TariffsModel> GetByVersionId(int tariffVersionId)
        {
            return tariffsRepo.GetTariffsByVersionId(tariffVersionId);
        }

        private void EnsureTariffVersion(TariffsModel tariff)
        {
            if (tariff == null || tariff.TariffVersionId > 0)
            {
                return;
            }

            var activeVersion = tariffVersionServices.GetActiveVersion();
            if (activeVersion == null)
            {
                throw new InvalidOperationException("No active tariff version is available.");
            }

            tariff.TariffVersionId = activeVersion.TariffVersionId;
        }
    }
}
