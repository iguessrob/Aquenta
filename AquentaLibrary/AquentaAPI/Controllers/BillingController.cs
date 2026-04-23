using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BillingController : Controller
    {
        BillingServices billingServices = new BillingServices();

        [HttpPost]
        public bool AddBilling(BillingModel billing)
        {
            return billingServices.Add(billing);
        }

        [HttpPut]
        public bool UpdateBilling(BillingModel billing)
        {
            return billingServices.Update(billing);
        }

        [HttpGet]
        public ActionResult GetAllBilling()
        {
            var user = billingServices.GetAll();
            return Ok(user);
        }

        [HttpGet("{id}")]
        public BillingModel GetByBillingId(int id)
        {
            return billingServices.GetbyId(id);
        }

        [HttpDelete]
        public bool DeleteBilling(int id)
        {
            return billingServices.Delete(id);
        }

        [HttpGet("concessioner/{concessionerId}")]
        public ActionResult GetBillingByConcessionerId(int concessionerId)
        {
            var billings = billingServices.GetByConcessionerId(concessionerId);
            return Ok(billings);
        }

        [HttpGet("water-consumption/monthly")]
        public ActionResult<int> GetMonthlyWaterConsumption(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            if (startDate >= endDate)
                return BadRequest("startDate must be earlier than endDate.");

            var total = billingServices.GetMonthlyWaterConsumption(startDate, endDate);
            return Ok(total);
        }

        [HttpGet("water-consumption/latest-month")]
        public ActionResult<int> GetLatestMonthWaterConsumption()
        {
            var total = billingServices.GetLatestMonthWaterConsumption();
            return Ok(total);
        }
    }
}
