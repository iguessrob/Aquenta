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
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(districtServices.Add(district));
        }

        [HttpPut]
        public ActionResult<bool> UpdateDistrict(DistrictModel district)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(districtServices.Update(district));
        }

        [HttpGet]
        public ActionResult GetAllDistrict()
        {
            var district = districtServices.GetAll();
            return Ok(district);
        }

        [HttpGet("{id}")]
        public DistrictModel GetDistrictById(int id)
        {
            return districtServices.GetbyId(id);
        }

        [HttpDelete]
        public ActionResult<bool> DeleteDistrict(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(districtServices.Delete(id));
        }
    }
}
