using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembershipController : Controller
    {
        MembershipServices membershipServices = new MembershipServices();

        [HttpPost]
        public ActionResult<bool> AddMembership(MembershipModel membership)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(membershipServices.Add(membership));
        }

        [HttpPut]
        public ActionResult<bool> UpdateMembership(MembershipModel membership)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(membershipServices.Update(membership));
        }

        [HttpGet]
        public ActionResult GetAllMembership()
        {
            var membership = membershipServices.GetAll();
            return Ok(membership);
        }

        [HttpGet("{id}")]
        public MembershipModel GetMembershipById(int id)
        {
            return membershipServices.GetbyId(id);
        }

        [HttpDelete]
        public ActionResult<bool> DeleteMembership(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (role != "Admin") return Unauthorized("Administrative privileges required.");
            return Ok(membershipServices.Delete(id));
        }
    }
}
