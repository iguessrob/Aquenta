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
        public bool AddPayment(PaymentModel payment)
        {
            return paymentServices.Add(payment);
        }

        [HttpPut]
        public bool UpdatePayment(PaymentModel payment )
        {
            return paymentServices.Update(payment);
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
        public bool DeletePayment(int id)
        {
            return paymentServices.Delete(id);
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
