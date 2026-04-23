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
        public bool AddTariffs(TariffsModel tariffs)
        {
            return tariffsServices.Add(tariffs);
        }

        
        [HttpPut]
        public bool UpdateTariffs(TariffsModel tariffs)
        {
            return tariffsServices.Update(tariffs);
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
