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

        [HttpPost("create-current")]
        public ActionResult<int> CreateTariffVersionFromCurrent([FromBody] TariffVersionModel request)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            if (request == null || string.IsNullOrWhiteSpace(request.VersionName))
            {
                return BadRequest("Version name is required.");
            }

            var newId = tariffVersionServices.CreateFromCurrentAndSetActive(request.VersionName.Trim());
            return Ok(newId);
        }

        [HttpPut("rename/{id}")]
        public ActionResult<bool> UpdateTariffVersionName(int id, [FromQuery] string newName)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            if (string.IsNullOrWhiteSpace(newName)) return BadRequest("New name is required.");
            var result = tariffVersionServices.UpdateName(id, newName);
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
            return tariffVersionServices.GetById(id);
        }

        [HttpDelete("{id}")]
        public ActionResult<bool> DeleteTariffVersion(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            return Ok(tariffVersionServices.Delete(id));
        }

        [HttpPost("set-active/{id}")]
        public ActionResult<bool> SetActive(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            var result = tariffVersionServices.SetActive(id);
            return Ok(result);
        }
    }
}