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
        UserServices userServices = new UserServices();
        ConcessionerServices concessionerServices = new ConcessionerServices();

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
        public bool AddUser(UserModel user)
        {
            return userServices.Add(user);
        }

        [HttpPut]
        public bool UpdateUser(UserModel user) 
        {
            return userServices.Update(user);
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
    }
}
