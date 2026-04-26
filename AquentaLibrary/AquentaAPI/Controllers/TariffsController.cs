using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TariffsController : Controller
    {
        private readonly TariffsServices tariffsServices = new TariffsServices();

        [HttpPost]
        public ActionResult<bool> AddTariffs([FromBody] TariffsModel tariffs)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            if (tariffs == null) return BadRequest("Tariff data is required.");

            try
            {
                var result = tariffsServices.Add(tariffs);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpPut]
        public ActionResult<bool> UpdateTariffs([FromBody] TariffsModel tariffs)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            if (tariffs == null) return BadRequest("Tariff data is required.");

            try
            {
                var result = tariffsServices.Update(tariffs);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

        [HttpGet]
        public ActionResult GetAllTariffs()
        {
            var tariffs = tariffsServices.GetAll();
            return Ok(tariffs);
        }

        [HttpGet("active")]
        public ActionResult GetActiveTariffs()
        {
            var tariffs = tariffsServices.GetActiveTariffRates();
            return Ok(tariffs);
        }

        [HttpGet("by-category/{categoryId}")]
        public ActionResult GetTariffsByCategoryId(int categoryId)
        {
            var tariffs = tariffsServices.GetByCategoryId(categoryId);
            return Ok(tariffs);
        }

        [HttpGet("by-version/{tariffVersionId}")]
        public ActionResult GetTariffsByVersionId(int tariffVersionId)
        {
            var tariffs = tariffsServices.GetByVersionId(tariffVersionId);
            return Ok(tariffs);
        }

        [HttpGet("{id}")]
        public TariffsModel GetTariffsById(int id)
        {
            return tariffsServices.GetbyId(id);
        }

        [HttpDelete]
        public ActionResult<bool> DeleteTariffs(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            return Ok(tariffsServices.Delete(id));
        }
    }
}
