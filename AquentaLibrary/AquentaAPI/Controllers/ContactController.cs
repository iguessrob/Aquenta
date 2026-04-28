using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : Controller
    {
        // Rate limiting: IP Address -> List of submission timestamps (sliding window)
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, List<DateTime>> _rateLimits = 
            new System.Collections.Concurrent.ConcurrentDictionary<string, List<DateTime>>();
        
        // Max 3 submissions per 15 minutes per IP
        private const int MaxSubmissionsPerWindow = 3;
        private const int RateLimitWindowMinutes = 15;

        private readonly ContactSubmissionServices _contactSubmissionServices = new ContactSubmissionServices();
        private readonly EmailService _emailService;

        public ContactController(EmailService emailService)
        {
            _emailService = emailService;
        }

        /// <summary>
        /// Strips HTML tags and potentially dangerous characters from input to prevent injection.
        /// </summary>
        private static string SanitizeInput(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            // Remove HTML tags
            var sanitized = Regex.Replace(input, @"<[^>]*>", string.Empty);

            // Remove potentially dangerous characters for email injection
            sanitized = sanitized.Replace("\r", "").Replace("\n", " ");

            return sanitized.Trim();
        }

        [HttpPost]
        public async Task<ActionResult> SubmitContact([FromBody] ContactSubmissionModel submission)
        {
            // Rate Limiting Check (sliding window: max 3 per 15 minutes per IP)
            string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var now = DateTime.UtcNow;

            var timestamps = _rateLimits.GetOrAdd(clientIp, _ => new List<DateTime>());
            lock (timestamps)
            {
                // Remove timestamps outside the window
                timestamps.RemoveAll(t => t < now.AddMinutes(-RateLimitWindowMinutes));

                if (timestamps.Count >= MaxSubmissionsPerWindow)
                {
                    return StatusCode(429, $"Too many requests. You can submit up to {MaxSubmissionsPerWindow} inquiries every {RateLimitWindowMinutes} minutes.");
                }
            }

            if (submission == null)
            {
                return BadRequest("Submission payload is required.");
            }

            if (string.IsNullOrWhiteSpace(submission.FullName))
            {
                return BadRequest("Full Name is required.");
            }

            if (string.IsNullOrWhiteSpace(submission.ContactNumber))
            {
                return BadRequest("Contact Number is required.");
            }

            if (submission.ContactNumber.Trim().Length != 11)
            {
                return BadRequest("Contact Number must be exactly 11 digits.");
            }

            if (string.IsNullOrWhiteSpace(submission.Email) || !IsValidEmail(submission.Email))
            {
                return BadRequest("A valid Email Address is required.");
            }

            // Account Number validation: if provided, must only contain numbers and dashes
            if (!string.IsNullOrWhiteSpace(submission.AccountNumber))
            {
                if (!Regex.IsMatch(submission.AccountNumber.Trim(), @"^[0-9\-]+$"))
                {
                    return BadRequest("Account Number can only contain numbers and dashes (-).");
                }
            }

            if (string.IsNullOrWhiteSpace(submission.Subject))
            {
                return BadRequest("Subject is required.");
            }

            if (string.IsNullOrWhiteSpace(submission.Message))
            {
                return BadRequest("Message is required.");
            }

            if (submission.Message.Trim().Length > 300)
            {
                return BadRequest("Message cannot exceed 300 characters.");
            }

            // Sanitize all text inputs before using them in an email
            string sanitizedFullName = SanitizeInput(submission.FullName);
            string sanitizedEmail = SanitizeInput(submission.Email);
            string sanitizedContactNumber = SanitizeInput(submission.ContactNumber);
            string sanitizedAccountNumber = SanitizeInput(submission.AccountNumber);
            string sanitizedSubject = SanitizeInput(submission.Subject);
            string sanitizedMessage = SanitizeInput(submission.Message);

            // var createdId = _contactSubmissionServices.Submit(submission);

            // Send notification email to Admin
            string adminEmail = "mabilanganrob@gmail.com";
            await _emailService.SendContactInquiryEmail(
                adminEmail,
                sanitizedFullName,
                sanitizedEmail,
                sanitizedContactNumber,
                sanitizedAccountNumber,
                sanitizedSubject,
                sanitizedMessage
            );

            // Record the timestamp for rate limiting
            lock (timestamps)
            {
                timestamps.Add(now);
            }

            return Ok(new { message = "Inquiry submitted successfully." });
        }

        [HttpGet]
        public ActionResult GetAllContacts()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var submissions = _contactSubmissionServices.GetAll();
            return Ok(submissions);
        }

        [HttpGet("{id}")]
        public ActionResult GetContactById(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var submission = _contactSubmissionServices.GetById(id);
            if (submission == null)
            {
                return NotFound();
            }

            return Ok(submission);
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
    }
}
