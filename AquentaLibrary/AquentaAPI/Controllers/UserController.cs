using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : Controller
    {
        private readonly UserServices userServices = new UserServices();
        private readonly ConcessionerServices concessionerServices = new ConcessionerServices();
        private readonly TokenService tokenService = new TokenService();
        private readonly EmailService _emailService;
        private readonly AquentaLibrary.Repositories.UserRepository userRepository = new AquentaLibrary.Repositories.UserRepository();

        public UserController(EmailService emailService)
        {
            _emailService = emailService;
        }

        public class LoginRequest
        {
            public string AccountNumber { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class LoginResponse
        {
            public int UserId { get; set; }
            public string UserName { get; set; } = string.Empty;
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string UserRole { get; set; } = string.Empty;
            public int? ConcessionerId { get; set; }
            public string? AccountNumber { get; set; }
        }

        [HttpPost("login")]
        public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.AccountNumber) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Account number and password are required.");
            }

            var accountNumber = request.AccountNumber.Trim();
            var inputPassword = request.Password.Trim();

            var users = userServices.GetAll();
            var concessioners = concessionerServices.GetAll();

            var concessionerUserIds = concessioners
                .Where(c => string.Equals((c.AccountNumber ?? string.Empty).Trim(), accountNumber, System.StringComparison.OrdinalIgnoreCase))
                .Select(c => c.UserId)
                .ToHashSet();

            var candidateUsers = users
                .Where(u =>
                    !u.IsDeleted &&
                    (
                        string.Equals((u.UserName ?? string.Empty).Trim(), accountNumber, System.StringComparison.OrdinalIgnoreCase)
                        || concessionerUserIds.Contains(u.UserId)
                    ))
                .ToList();

            var user = candidateUsers.FirstOrDefault(u =>
            {
                return !string.IsNullOrWhiteSpace(u.Pass)
                    && string.Equals(u.Pass.Trim(), inputPassword, System.StringComparison.Ordinal);
            });

            if (user == null)
            {
                return Unauthorized("Invalid account number or password.");
            }

            // Find matching concessioner record for this user
            var concessioner = concessioners.FirstOrDefault(c => c.UserId == user.UserId);

            return Ok(new LoginResponse
            {
                UserId = user.UserId,
                UserName = user.UserName ?? string.Empty,
                FirstName = user.FirstName ?? string.Empty,
                LastName = user.LastName ?? string.Empty,
                UserRole = user.UserRole ?? string.Empty,
                ConcessionerId = concessioner?.ConcessionerId,
                AccountNumber = concessioner?.AccountNumber
            });
        }

        [HttpPost]
        public ActionResult<bool> AddUser([FromBody] UserModel user)
        {
            if (user == null) return BadRequest("User data is required.");
            var result = userServices.Add(user);
            return Ok(result);
        }

        [HttpPut]
        public ActionResult<bool> UpdateUser([FromBody] UserModel user)
        {
            if (user == null) return BadRequest("User data is required.");
            var result = userServices.Update(user);
            return Ok(result);
        }


        [HttpGet]
        public ActionResult GetAllUser()
        {
            var user = userServices.GetAll();
            return Ok(user);
        }

        [HttpGet("{id}")]
        public UserModel GetByUserId(int id)
        {
            return userServices.GetbyId(id);
        }

        [HttpDelete]
        public bool DeleteUser(int id)
        {
            return userServices.Delete(id);
        }

        public class ForgotPasswordRequest
        {
            public string Identifier { get; set; } = string.Empty;
            public string? FrontendBaseUrl { get; set; }
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Identifier))
                return BadRequest("Identifier is required.");

            var user = userRepository.GetUserByEmailOrAccount(request.Identifier);
            if (user == null)
            {
                // For security, don't reveal if user exists, but here we can be helpful or silent
                // For this task, we'll return 200 regardless to prevent enumeration
                return Ok("If an account exists with that identifier, a reset link has been sent.");
            }

            var token = tokenService.GenerateResetToken(user.UserId);
            
            // Get user's details for the admin email
            var concessioner = concessionerServices.GetAll().FirstOrDefault(c => c.UserId == user.UserId);
            string userName = $"{user.FirstName} {user.LastName}";
            string accountNumber = concessioner?.AccountNumber ?? "N/A";

            // Use provided frontend base URL or default to current
            string baseUrl = request.FrontendBaseUrl ?? "http://localhost:5500"; 
            string resetLink = $"{baseUrl}/reset-password.html?token={token}";

            // The recipient is the admin (you)
            string adminEmail = "mabilanganrob@gmail.com"; 
            await _emailService.SendPasswordResetEmail(adminEmail, userName, accountNumber, resetLink);

            return Ok("If an account exists with that identifier, a reset link has been sent.");
        }

        public class ResetPasswordRequest
        {
            public string Token { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        [HttpPost("reset-password")]
        public ActionResult ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest("Token and new password are required.");

            var (userId, isValid) = tokenService.ValidateToken(request.Token);
            if (!isValid)
                return BadRequest("Invalid or expired reset token.");

            var success = userRepository.UpdatePassword(userId, request.NewPassword);
            if (!success)
                return StatusCode(500, "Failed to update password.");

            return Ok("Password has been reset successfully.");
        }
    }
}
