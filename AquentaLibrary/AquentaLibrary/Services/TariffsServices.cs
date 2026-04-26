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

        public bool Add(TariffsModel tariff)
        {
            EnsureTariffVersion(tariff);

            // Prevent duplicate cubic meter entries in the same version/category
            var isDuplicate = tariffsRepo.GetTariffsByVersionId(tariff.TariffVersionId)
                .Any(t => t.CategoryId == tariff.CategoryId && t.CubicMeter == tariff.CubicMeter);

            if (isDuplicate)
            {
                throw new InvalidOperationException($"A rate for {tariff.CubicMeter} cubic meters already exists in this category.");
            }

            return tariffsRepo.AddTariffs(tariff);
        }

        public bool Update(TariffsModel tariff)
        {
            EnsureTariffVersion(tariff);

            // Prevent duplicate cubic meter entries in the same version/category (excluding current record)
            var isDuplicate = tariffsRepo.GetTariffsByVersionId(tariff.TariffVersionId)
                .Any(t => t.CategoryId == tariff.CategoryId && t.CubicMeter == tariff.CubicMeter && t.RateId != tariff.RateId);

            if (isDuplicate)
            {
                throw new InvalidOperationException($"A rate for {tariff.CubicMeter} cubic meters already exists in this category.");
            }

            return tariffsRepo.UpdateTariffs(tariff);
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
