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
        public ActionResult<bool> AddBilling(BillingModel billing)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(billingServices.Add(billing));
        }

        [HttpPut]
        public ActionResult<bool> UpdateBilling(BillingModel billing)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(billingServices.Update(billing));
        }

        [HttpGet]
        public ActionResult GetAllBilling()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            var user = billingServices.GetAll();
            return Ok(user);
        }

        [HttpGet("{id}")]
        public ActionResult GetByBillingId(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            var billing = billingServices.GetbyId(id);
            if (billing == null) return NotFound("Billing record not found.");
            return Ok(billing);
        }

        [HttpDelete]
        public ActionResult<bool> DeleteBilling(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(billingServices.Delete(id));
        }

        [HttpGet("concessioner/{concessionerId}")]
        public ActionResult GetBillingByConcessionerId(int concessionerId)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            var requestingUserId = HttpContext.Items["UserId"] as int? ?? 0;

            if (role == "Admin")
            {
                // Admin can view any concessioner's billing
                var billings = billingServices.GetByConcessionerId(concessionerId);
                return Ok(billings);
            }

            // IDOR Protection: Concessioner can only view their own billing
            var concessionerServices = new ConcessionerServices();
            var concessioner = concessionerServices.GetbyId(concessionerId);
            if (concessioner == null || concessioner.UserId != requestingUserId)
            {
                return StatusCode(403, "You do not have permission to view this billing data.");
            }

            var ownBillings = billingServices.GetByConcessionerId(concessionerId);
            return Ok(ownBillings);
        }

        [HttpGet("water-consumption/monthly")]
        public ActionResult<int> GetMonthlyWaterConsumption(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            if (startDate >= endDate)
                return BadRequest("startDate must be earlier than endDate.");

            var total = billingServices.GetMonthlyWaterConsumption(startDate, endDate);
            return Ok(total);
        }

        [HttpGet("water-consumption/latest-month")]
        public ActionResult<int> GetLatestMonthWaterConsumption()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            var total = billingServices.GetLatestMonthWaterConsumption();
            return Ok(total);
        }
    }
}
