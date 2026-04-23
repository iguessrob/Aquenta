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
        public bool AddDistrict(DistrictModel district)
        {
            return districtServices.Add(district);
        }

        [HttpPut]
        public bool UpdateDistrict(DistrictModel district)
        {
            return districtServices.Update(district);
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
        public bool DeleteDistrict(int id)
        {
            return districtServices.Delete(id);
        }
    }
}
