using AquentaAPI.Models.DTOs;
using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace AquentaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("[controller]")] // Fallback in case /api is stripped
    public class UserController : ControllerBase
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
            public string Token { get; set; } = string.Empty;
        }

        /// <summary>
        /// Maps a UserModel to a UserDto, stripping sensitive fields (password, IsDeleted, CreatedAt).
        /// </summary>
        private static UserDto ToDto(UserModel user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                UserName = user.UserName ?? string.Empty,
                FirstName = user.FirstName ?? string.Empty,
                LastName = user.LastName ?? string.Empty,
                UserRole = user.UserRole ?? string.Empty
            };
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
                if (string.IsNullOrWhiteSpace(u.Pass))
                {
                    return false;
                }

                try
                {
                    return BCrypt.Net.BCrypt.EnhancedVerify(inputPassword, u.Pass);
                }
                catch (BCrypt.Net.SaltParseException)
                {
                    // Backward compatibility for legacy plain-text passwords.
                    return string.Equals(u.Pass.Trim(), inputPassword, System.StringComparison.Ordinal);
                }
            });

            if (user == null)
            {
                return Unauthorized("Invalid account number or password.");
            }

            try
            {
                // If password is legacy plain text, upgrade it to bcrypt hash after successful login.
                BCrypt.Net.BCrypt.EnhancedVerify(inputPassword, user.Pass);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                userRepository.UpdatePassword(user.UserId, inputPassword);
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
                AccountNumber = concessioner?.AccountNumber,
                Token = tokenService.GenerateSessionToken(user.UserId, user.UserRole ?? string.Empty)
            });
        }

        [HttpPost]
        public ActionResult<bool> AddUser([FromBody] UserModel user)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            if (user == null) return BadRequest("User data is required.");
            var result = userServices.Add(user);
            return Ok(result);
        }

        [HttpPut]
        public ActionResult<bool> UpdateUser([FromBody] UserModel user)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            if (user == null) return BadRequest("User data is required.");
            var result = userServices.Update(user);
            return Ok(result);
        }


        [HttpGet]
        public ActionResult GetAllUser()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var users = userServices.GetAll();
            // Return DTOs instead of raw UserModel to prevent password hash leakage
            var dtos = users.Where(u => !u.IsDeleted).Select(ToDto).ToList();
            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public ActionResult GetByUserId(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            var requestingUserId = HttpContext.Items["UserId"] as int? ?? 0;

            // IDOR Protection: Non-admin users can only view their own data
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) && requestingUserId != id)
            {
                return StatusCode(403, "You do not have permission to view this user.");
            }

            var user = userServices.GetbyId(id);
            if (user == null || user.IsDeleted)
            {
                return NotFound("User not found.");
            }

            return Ok(ToDto(user));
        }

        [HttpDelete]
        public ActionResult<bool> DeleteUser(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var result = userServices.Delete(id);
            return Ok(result);
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
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
                return BadRequest("Token is required.");

            var (userId, role, isValid) = tokenService.ValidateToken(request.Token);
            if (!isValid)
                return BadRequest("Invalid or expired reset token.");

            // Get user info for dynamic default password and email
            var user = userRepository.GetUserById(userId);
            if (user == null)
                return NotFound("User not found.");

            // Determine default password: LastName@2026
            string defaultPassword = $"{user.LastName}@2026";
            
            // Always reset to default password as requested by the user
            string finalPassword = defaultPassword;

            var success = userRepository.UpdatePassword(userId, finalPassword);
            if (!success)
                return StatusCode(500, "Failed to update password.");

            // Get user's email from concessioner record
            var concessioner = concessionerServices.GetAll().FirstOrDefault(c => c.UserId == userId);
            if (concessioner != null && !string.IsNullOrEmpty(concessioner.EmailAddress))
            {
                string fullName = $"{user.FirstName} {user.LastName}";
                await _emailService.SendPasswordResetConfirmationEmail(concessioner.EmailAddress, fullName, finalPassword);
            }

            return Ok("Password has been reset successfully.");
        }
    }
}
