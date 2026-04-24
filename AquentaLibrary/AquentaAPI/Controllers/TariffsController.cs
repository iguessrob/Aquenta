using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TariffsController : Controller
    {
        TariffsServices tariffsServices = new TariffsServices();

        
        [HttpPost]
        public ActionResult<bool> AddTariffs([FromBody] TariffsModel tariffs)
        {
            if (tariffs == null) return BadRequest("Tariff data is required.");
            var result = tariffsServices.Add(tariffs);
            return Ok(result);
        }

        [HttpPut]
        public ActionResult<bool> UpdateTariffs([FromBody] TariffsModel tariffs)
        {
            if (tariffs == null) return BadRequest("Tariff data is required.");
            var result = tariffsServices.Update(tariffs);
            return Ok(result);
        }

        [HttpGet]
        public ActionResult GetAllTariffs()
        {
            var tariffs = tariffsServices.GetAll();
            return Ok(tariffs);
        }

        [HttpGet("{id}")]
        public TariffsModel GetTariffsById(int id)
        {
            return tariffsServices.GetbyId(id);
        }

        [HttpDelete]
        public bool DeleteTariffs(int id)
        {
            return tariffsServices.Delete(id);
        }
    }
}
