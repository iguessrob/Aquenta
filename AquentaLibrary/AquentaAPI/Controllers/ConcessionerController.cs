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

        private static void NormalizeOptionalFields(ConcessionerModel concessioner)
        {
            if (concessioner == null) return;

            concessioner.Address = (concessioner.Address ?? string.Empty).Trim();
            concessioner.ContactNumber = (concessioner.ContactNumber ?? string.Empty).Trim();
            concessioner.EmailAddress = (concessioner.EmailAddress ?? string.Empty).Trim();
        }

        [HttpPost]
        public ActionResult<bool> AddConcessioner(ConcessionerModel concessioner)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            NormalizeOptionalFields(concessioner);
            return Ok(concessionerServices.Add(concessioner));
        }

        [HttpPut]
        public ActionResult<bool> UpdateConcessioner(ConcessionerModel concessioner)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            NormalizeOptionalFields(concessioner);
            return Ok(concessionerServices.Update(concessioner));
        }

        [HttpGet]
        public ActionResult GetAllConcessioners()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            var user = concessionerServices.GetAll();
            return Ok(user);
        }

        [HttpGet("active")]
        public ActionResult GetAllActiveConcessioners()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            var user = concessionerServices.GetAllActive();
            return Ok(user);
        }

        [HttpGet("{id}")]
        public ActionResult GetByConcessionerId(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            var requestingUserId = HttpContext.Items["UserId"] as int? ?? 0;

            var concessioner = concessionerServices.GetbyId(id);
            if (concessioner == null)
            {
                return NotFound("Concessioner not found.");
            }

            // IDOR Protection: Non-admin users can only view their own concessioner record
            if (role != "Admin" && concessioner.UserId != requestingUserId)
            {
                return StatusCode(403, "You do not have permission to view this record.");
            }

            return Ok(concessioner);
        }

        [HttpDelete]
        public ActionResult<bool> DeleteConcessioner(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            return Ok(concessionerServices.Delete(id));
        }

        [HttpGet("active/count")]
        public ActionResult<int> GetTotalActiveConcessioners([FromQuery] string status)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");

            if (string.IsNullOrWhiteSpace(status))
                return BadRequest("status query parameter is required.");

            var total = concessionerServices.GetTotalActiveConcessioners(status);
            return Ok(total);
        }

        [HttpGet("user/{userId}")]
        public ActionResult GetByUserId(int userId)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            var requestingUserId = HttpContext.Items["UserId"] as int? ?? 0;

            // IDOR Protection: Non-admin users can only look up their own concessioner record
            if (role != "Admin" && requestingUserId != userId)
            {
                return StatusCode(403, "You do not have permission to view this record.");
            }

            var concessioner = concessionerServices.GetByUserId(userId);
            if (concessioner == null)
                return NotFound("No concessioner found for this user.");
            return Ok(concessioner);
        }
    }
}
