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

        public TariffVersionModel GetbyId(int id)
        {
            return tariffVersionRepo.GetTariffVersionById(id);
        }

        public TariffVersionModel GetActiveVersion()
        {
            return tariffVersionRepo.GetActiveTariffVersion();
        }

        public bool Add(TariffVersionModel tariffVersion)
        {
            return tariffVersionRepo.InsertTariffVersion(tariffVersion) > 0;
        }

        public int CreateFromCurrentAndSetActive(string versionName)
        {
            return tariffVersionRepo.CreateFromCurrentAndSetActive(versionName);
        }

        public bool Update(TariffVersionModel tariffVersion)
        {
            return tariffVersionRepo.UpdateTariffVersionSP(tariffVersion) > 0;
        }

        public bool Delete(int id)
        {
            return tariffVersionRepo.DeleteTariffVersionSP(id) > 0;
        }
    }
}