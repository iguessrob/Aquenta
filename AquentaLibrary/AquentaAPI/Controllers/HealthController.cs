using Microsoft.AspNetCore.Mvc;
using AquentaLibrary.Repositories;
using System;

namespace AquentaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("[controller]")] // Flexible routing
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            try
            {
                var connectionString = SqlConnectionResolver.GetWorkingConnectionString();
                var displayString = connectionString.Split(';')[0];
                return Ok(new { 
                    Status = "Healthy", 
                    Database = "Connected", 
                    Info = displayString,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                var message = ex.Message;
                if (ex.InnerException != null)
                {
                    message += " Details: " + ex.InnerException.Message;
                }
                return Problem(detail: message, title: "Database Connection Failed");
            }
        }
    }
}
