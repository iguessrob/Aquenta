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

        public IEnumerable<TariffsModel> GetByVersionName(string versionName)
        {
            return tariffsRepo.GetTariffsByVersionName(versionName);
        }

        private void EnsureTariffVersion(TariffsModel tariff)
        {
            if (tariff == null || !string.IsNullOrEmpty(tariff.VersionName))
            {
                return;
            }

            var activeVersion = tariffVersionServices.GetActiveVersion();
            if (activeVersion == null)
            {
                throw new InvalidOperationException("No active tariff version is available.");
            }

            tariff.VersionName = activeVersion.VersionName;
            tariff.IsActive = activeVersion.IsActive;
        }
    }
}
