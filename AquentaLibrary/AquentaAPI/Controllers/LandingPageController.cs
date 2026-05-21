using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
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

            var validation = ValidatePayload(payload);
            if (!validation.IsValid)
            {
                return BadRequest(new { message = validation.ErrorMessage });
            }

            var sanitizedSettings = SanitizeSettings(payload.settings);
            var sanitizedFaqs = SanitizeFaqs(payload.faqs ?? new List<LandingPageFaqModel>());

            var ok = _services.SaveLandingPage(sanitizedSettings, sanitizedFaqs);
            if (!ok) return StatusCode(500, "Failed to save landing page settings.");
            return Ok(new { message = "Saved" });
        }

        private static (bool IsValid, string? ErrorMessage) ValidatePayload(LandingPagePayload payload)
        {
            var settings = payload.settings;
            if (settings == null)
            {
                return (false, "Settings are required.");
            }

            if (string.IsNullOrWhiteSpace(settings.OfficeName)) return (false, "Office name is required.");
            if (string.IsNullOrWhiteSpace(settings.Address)) return (false, "Address is required.");
            if (string.IsNullOrWhiteSpace(settings.OfficeHours)) return (false, "Office hours are required.");
            if (!string.IsNullOrWhiteSpace(settings.EmailAddress) && !IsValidEmail(settings.EmailAddress))
            {
                return (false, "A valid email address is required.");
            }

            if (!string.IsNullOrWhiteSpace(settings.LandlineNumber) && !Regex.IsMatch(settings.LandlineNumber, @"^[0-9\-+()\s]{7,25}$"))
            {
                return (false, "Landline number can only contain digits, spaces, +, -, and parentheses.");
            }

            if (settings.GoogleMapsEmbedCode != null && settings.GoogleMapsEmbedCode.Length > 2000)
            {
                return (false, "Google Maps embed code is too long.");
            }

            var faqs = payload.faqs ?? new List<LandingPageFaqModel>();
            if (!faqs.Any()) return (false, "At least one FAQ is required.");

            foreach (var faq in faqs)
            {
                if (faq == null) return (false, "FAQ entries cannot be null.");
                if (string.IsNullOrWhiteSpace(faq.Question)) return (false, "FAQ question is required.");
                if (string.IsNullOrWhiteSpace(faq.Answer)) return (false, "FAQ answer is required.");
                if (faq.Question.Length > 300) return (false, "FAQ questions must be 300 characters or less.");
                if (faq.Answer.Length > 2000) return (false, "FAQ answers must be 2000 characters or less.");
            }

            return (true, null);
        }

        private static LandingPageSettingsModel SanitizeSettings(LandingPageSettingsModel settings)
        {
            return new LandingPageSettingsModel
            {
                LandingPageSettingsID = settings.LandingPageSettingsID,
                OfficeName = SanitizeText(settings.OfficeName, 200),
                Address = SanitizeText(settings.Address, 500),
                OfficeHours = SanitizeText(settings.OfficeHours, 250),
                LandlineNumber = SanitizeText(settings.LandlineNumber, 50),
                EmailAddress = SanitizeText(settings.EmailAddress, 120),
                GoogleMapsEmbedCode = SanitizeEmbedCode(settings.GoogleMapsEmbedCode)
            };
        }

        private static List<LandingPageFaqModel> SanitizeFaqs(IEnumerable<LandingPageFaqModel> faqs)
        {
            var result = new List<LandingPageFaqModel>();
            var index = 1;

            foreach (var faq in faqs)
            {
                if (faq == null) continue;

                result.Add(new LandingPageFaqModel
                {
                    LandingPageFaqID = faq.LandingPageFaqID,
                    Question = SanitizeText(faq.Question, 300),
                    Answer = SanitizeText(faq.Answer, 2000),
                    SortOrder = index++
                });
            }

            return result;
        }

        private static string? SanitizeText(string? input, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            
            // Basic tag stripping
            var sanitized = Regex.Replace(input, @"<[^>]*>", string.Empty).Trim();

            return sanitized.Length > maxLength ? sanitized[..maxLength] : sanitized;
        }

        private static string? SanitizeEmbedCode(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            var trimmed = input.Trim();

            if (!trimmed.Contains("<iframe", System.StringComparison.OrdinalIgnoreCase))
            {
                return string.Empty;
            }

            return trimmed.Length > 2000 ? trimmed[..2000] : trimmed;
        }

        private static bool IsValidEmail(string email)
        {
            try
            {
                var _ = new System.Net.Mail.MailAddress(email);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public class LandingPagePayload
        {
            public LandingPageSettingsModel? settings { get; set; }
            public System.Collections.Generic.List<LandingPageFaqModel>? faqs { get; set; }
        }
    }
}
