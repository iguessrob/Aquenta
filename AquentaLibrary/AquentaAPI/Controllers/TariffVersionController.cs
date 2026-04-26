using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TariffVersionController : Controller
    {
        private readonly TariffVersionServices tariffVersionServices = new TariffVersionServices();

        [HttpPost]
        public ActionResult<bool> AddTariffVersion([FromBody] TariffVersionModel tariffVersion)
        {
            if (tariffVersion == null) return BadRequest("Tariff version data is required.");
            var result = tariffVersionServices.Add(tariffVersion);
            return Ok(result);
        }

        [HttpPost("create-current")]
        public ActionResult<int> CreateTariffVersionFromCurrent([FromBody] TariffVersionModel request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.VersionName))
            {
                return BadRequest("Version name is required.");
            }

            var newId = tariffVersionServices.CreateFromCurrentAndSetActive(request.VersionName.Trim());
            return Ok(newId);
        }

        [HttpPut]
        public ActionResult<bool> UpdateTariffVersion([FromBody] TariffVersionModel tariffVersion)
        {
            if (tariffVersion == null) return BadRequest("Tariff version data is required.");
            var result = tariffVersionServices.Update(tariffVersion);
            return Ok(result);
        }

        [HttpGet]
        public ActionResult GetAllTariffVersions()
        {
            var versions = tariffVersionServices.GetAll();
            return Ok(versions);
        }

        [HttpGet("active")]
        public ActionResult GetActiveTariffVersion()
        {
            var version = tariffVersionServices.GetActiveVersion();
            return Ok(version);
        }

        [HttpGet("{id}")]
        public TariffVersionModel GetTariffVersionById(int id)
        {
            return tariffVersionServices.GetbyId(id);
        }

        [HttpDelete("{id}")]
        public bool DeleteTariffVersion(int id)
        {
            return tariffVersionServices.Delete(id);
        }
    }
}