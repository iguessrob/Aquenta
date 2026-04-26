using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : Controller
    {
        PaymentServices paymentServices = new PaymentServices();

        [HttpPost]
        public ActionResult<bool> AddPayment(PaymentModel payment)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(paymentServices.Add(payment));
        }

        [HttpPut]
        public ActionResult<bool> UpdatePayment(PaymentModel payment )
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(paymentServices.Update(payment));
        }

        [HttpGet]
        public ActionResult GetAllPayment()
        {
            var payment = paymentServices.GetAll();
            return Ok(payment);
        }

        [HttpGet("{id}")]
        public PaymentModel GetPaymentById(int id)
        {
            return paymentServices.GetbyId(id);
        }

        [HttpDelete]
        public ActionResult<bool> DeletePayment(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(paymentServices.Delete(id));
        }

        [HttpGet("concessioner/{concessionerId}")]
        public ActionResult GetPaymentsByConcessionerId(int concessionerId)
        {
            var payments = paymentServices.GetPaymentsByConcessionerId(concessionerId);
            return Ok(payments);
        }

        [HttpPost("distribute")]
        public ActionResult DistributePayment([FromBody] DistributePaymentRequest request)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            try
            {
                var result = paymentServices.DistributePayment(
                    request.ConcessionerID,
                    request.AmountPaid,
                    request.CurrentBillingID);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("reverse-distribution")]
        public ActionResult ReverseDistribution([FromBody] ReverseDistributionRequest request)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            try
            {
                var result = paymentServices.ReverseDistribution(request.ConcessionerID);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
