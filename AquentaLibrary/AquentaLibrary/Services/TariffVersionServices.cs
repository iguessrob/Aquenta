using System.Collections.Generic;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class TariffVersionServices
    {
        private readonly TariffVersionRepository tariffVersionRepo = new TariffVersionRepository();

        public IEnumerable<TariffVersionModel> GetAll()
        {
            return tariffVersionRepo.GetAllTariffVersions();
        }

        public TariffVersionModel GetByName(string versionName)
        {
            return tariffVersionRepo.GetTariffVersionByName(versionName);
        }

        public TariffVersionModel GetActiveVersion()
        {
            return tariffVersionRepo.GetActiveTariffVersion();
        }

        public bool Add(TariffVersionModel tariffVersion)
        {
            return !string.IsNullOrEmpty(tariffVersionRepo.InsertTariffVersion(tariffVersion));
        }

        public string CreateFromCurrentAndSetActive(string versionName)
        {
            return tariffVersionRepo.CreateFromCurrentAndSetActive(versionName);
        }

        public bool UpdateName(string oldName, string newName)
        {
            return tariffVersionRepo.UpdateTariffVersionName(oldName, newName) > 0;
        }

        public bool Delete(string versionName)
        {
            return tariffVersionRepo.DeleteTariffVersionSP(versionName) > 0;
        }
    }
}