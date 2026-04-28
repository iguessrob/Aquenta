using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DistrictController : Controller
    {
        DistrictServices districtServices = new DistrictServices();

        [HttpPost]
        public ActionResult<bool> AddDistrict(DistrictModel district)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(districtServices.Add(district));
        }

        [HttpPut]
        public ActionResult<bool> UpdateDistrict(DistrictModel district)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(districtServices.Update(district));
        }

        [HttpGet]
        public ActionResult GetAllDistrict()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var district = districtServices.GetAll();
            return Ok(district);
        }

        [HttpGet("{id}")]
        public ActionResult GetDistrictById(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var district = districtServices.GetbyId(id);
            if (district == null) return NotFound("District not found.");
            return Ok(district);
        }

        [HttpDelete]
        public ActionResult<bool> DeleteDistrict(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(districtServices.Delete(id));
        }
    }
}
