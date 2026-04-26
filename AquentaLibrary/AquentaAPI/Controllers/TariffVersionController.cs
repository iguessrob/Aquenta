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
        public ActionResult<string> CreateTariffVersionFromCurrent([FromBody] TariffVersionModel request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.VersionName))
            {
                return BadRequest("Version name is required.");
            }

            var newName = tariffVersionServices.CreateFromCurrentAndSetActive(request.VersionName.Trim());
            return Ok(newName);
        }

        [HttpPut("rename")]
        public ActionResult<bool> UpdateTariffVersionName([FromQuery] string oldName, [FromQuery] string newName)
        {
            if (string.IsNullOrWhiteSpace(oldName) || string.IsNullOrWhiteSpace(newName)) return BadRequest("Both names are required.");
            var result = tariffVersionServices.UpdateName(oldName, newName);
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

        [HttpGet("{name}")]
        public TariffVersionModel GetTariffVersionByName(string name)
        {
            return tariffVersionServices.GetByName(name);
        }

        [HttpDelete("{name}")]
        public bool DeleteTariffVersion(string name)
        {
            return tariffVersionServices.Delete(name);
        }

        [HttpPost("set-active/{name}")]
        public ActionResult<bool> SetActive(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name is required.");
            var result = tariffVersionServices.SetActive(name);
            return Ok(result);
        }
    }
}