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

        public TariffVersionModel GetById(int id)
        {
            return tariffVersionRepo.GetTariffVersionById(id);
        }

        public TariffVersionModel GetActiveVersion()
        {
            return tariffVersionRepo.GetActiveTariffVersion();
        }

        public int CreateFromCurrentAndSetActive(string versionName)
        {
            return tariffVersionRepo.CreateFromCurrentAndSetActive(versionName);
        }

        public bool UpdateName(int id, string newName)
        {
            return tariffVersionRepo.UpdateTariffVersionName(id, newName) > 0;
        }

        public bool Delete(int id)
        {
            return tariffVersionRepo.DeleteTariffVersionSP(id) > 0;
        }

        public bool SetActive(int id)
        {
            return tariffVersionRepo.SetActive(id) > 0;
        }
    }
}