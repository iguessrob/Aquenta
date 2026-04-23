using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : Controller
    {
        private readonly ContactSubmissionServices _contactSubmissionServices = new ContactSubmissionServices();

        [HttpPost]
        public ActionResult SubmitContact([FromBody] ContactSubmissionModel submission)
        {
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

            var createdId = _contactSubmissionServices.Submit(submission);
            return Ok(new { contactSubmissionId = createdId, message = "Inquiry submitted successfully." });
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
