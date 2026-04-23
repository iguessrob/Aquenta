using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConcessionerController : Controller
    {
        ConcessionerServices concessionerServices = new ConcessionerServices();

        [HttpPost]
        public bool AddConcessioner(ConcessionerModel concessioner)
        {
            return concessionerServices.Add(concessioner);
        }

        [HttpPut]
        public bool UpdateConcessioner(ConcessionerModel concessioner)
        {
            return concessionerServices.Update(concessioner);
        }

        [HttpGet]
        public ActionResult GetAllConcessioners()
        {
            var user = concessionerServices.GetAll();
            return Ok(user);
        }

        [HttpGet("active")]
        public ActionResult GetAllActiveConcessioners()
        {
            var user = concessionerServices.GetAllActive();
            return Ok(user);
        }

        [HttpGet("{id}")]
        public ConcessionerModel GetByConcessionerId(int id)
        {
            return concessionerServices.GetbyId(id);
        }

        [HttpDelete]
        public bool DeleteConcessioner(int id)
        {
            return concessionerServices.Delete(id);
        }

        [HttpGet("active/count")]
        public ActionResult<int> GetTotalActiveConcessioners([FromQuery] string status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return BadRequest("status query parameter is required.");

            var total = concessionerServices.GetTotalActiveConcessioners(status);
            return Ok(total);
        }

        [HttpGet("user/{userId}")]
        public ActionResult GetByUserId(int userId)
        {
            var concessioner = concessionerServices.GetByUserId(userId);
            if (concessioner == null)
                return NotFound("No concessioner found for this user.");
            return Ok(concessioner);
        }
    }
}
