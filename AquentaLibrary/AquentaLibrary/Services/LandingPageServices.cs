using System.Collections.Generic;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class LandingPageServices
    {
        private readonly LandingPageRepository _repo = new LandingPageRepository();

        public LandingPageSettingsModel GetSettings()
        {
            return _repo.GetSettings();
        }

        public IEnumerable<LandingPageFaqModel> GetFaqs()
        {
            return _repo.GetFaqs();
        }

        public bool SaveLandingPage(LandingPageSettingsModel settings, IEnumerable<LandingPageFaqModel> faqs)
        {
            // Basic sanitization/trimming could be applied here if desired
            var ok = _repo.UpsertSettings(settings);
            _repo.SyncFaqs(faqs ?? new List<LandingPageFaqModel>());
            return ok;
        }
    }
}
