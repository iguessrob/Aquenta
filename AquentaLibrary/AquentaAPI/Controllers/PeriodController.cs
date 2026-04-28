using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PeriodController : Controller
    {
        PeriodServices periodServices = new PeriodServices();

        [HttpPost]
        public ActionResult<bool> AddPeriod(PeriodModel period)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(periodServices.Add(period));
        }

        [HttpPut]
        public ActionResult<bool> UpdatePeriod(PeriodModel period)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(periodServices.Update(period));
        }

        [HttpGet]
        public ActionResult GetAllPeriod()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var period = periodServices.GetAll();
            return Ok(period);
        }

        [HttpGet("{id}")]
        public ActionResult GetPeriodById(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var period = periodServices.GetbyId(id);
            if (period == null) return NotFound("Period not found.");
            return Ok(period);
        }

        [HttpDelete]
        public ActionResult<bool> DeletePeriod(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(periodServices.Delete(id));
        }
    }
}
