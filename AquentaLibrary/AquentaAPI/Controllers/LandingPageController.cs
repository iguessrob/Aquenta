using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LandingPageController : Controller
    {
        private readonly LandingPageServices _services = new LandingPageServices();

        [HttpGet("home")]
        public ActionResult GetHome()
        {
            var settings = _services.GetSettings();
            var faqs = _services.GetFaqs();

            return Ok(new { settings, faqs });
        }

        [HttpPut("home")]
        public ActionResult SaveHome([FromBody] LandingPagePayload payload)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", System.StringComparison.OrdinalIgnoreCase))
                return Unauthorized("Administrative privileges required.");

            if (payload == null || payload.settings == null)
            {
                return BadRequest("Payload missing.");
            }

            var ok = _services.SaveLandingPage(payload.settings, payload.faqs ?? new System.Collections.Generic.List<LandingPageFaqModel>());
            if (!ok) return StatusCode(500, "Failed to save landing page settings.");
            return Ok(new { message = "Saved" });
        }

        public class LandingPagePayload
        {
            public LandingPageSettingsModel? settings { get; set; }
            public System.Collections.Generic.List<LandingPageFaqModel>? faqs { get; set; }
        }
    }
}
