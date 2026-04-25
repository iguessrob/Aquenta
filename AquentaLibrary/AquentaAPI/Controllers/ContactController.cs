using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : Controller
    {
        // Rate limiting: IP Address -> Last Submission Time
        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, DateTime> _rateLimits = 
            new System.Collections.Concurrent.ConcurrentDictionary<string, DateTime>();
        
        private readonly ContactSubmissionServices _contactSubmissionServices = new ContactSubmissionServices();
        private readonly EmailService _emailService;

        public ContactController(EmailService emailService)
        {
            _emailService = emailService;
        }

        [HttpPost]
        public async Task<ActionResult> SubmitContact([FromBody] ContactSubmissionModel submission)
        {
            // Rate Limiting Check (1 per 5 minutes per IP)
            string clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            if (_rateLimits.TryGetValue(clientIp, out DateTime lastSubmission))
            {
                if (DateTime.Now < lastSubmission.AddMinutes(5))
                {
                    var waitTime = Math.Ceiling((lastSubmission.AddMinutes(5) - DateTime.Now).TotalMinutes);
                    return StatusCode(429, $"Too many requests. Please wait {waitTime} minute(s) before submitting another inquiry.");
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

            // var createdId = _contactSubmissionServices.Submit(submission);

            // Send notification email to Admin
            string adminEmail = "mabilanganrob@gmail.com";
            await _emailService.SendContactInquiryEmail(
                adminEmail,
                submission.FullName,
                submission.Email,
                submission.ContactNumber,
                submission.AccountNumber,
                submission.Subject,
                submission.Message
            );

            // Update rate limit time
            _rateLimits[clientIp] = DateTime.Now;

            return Ok(new { message = "Inquiry submitted successfully." });
        }

        [HttpGet]
        public ActionResult GetAllContacts()
        {
            var submissions = _contactSubmissionServices.GetAll();
            return Ok(submissions);
        }

        [HttpGet("{id}")]
        public ActionResult GetContactById(int id)
        {
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
