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
        public bool AddMembership(MembershipModel membership)
        {
            return membershipServices.Add(membership);
        }

        [HttpPut]
        public bool UpdateMembership(MembershipModel membership)
        {
            return membershipServices.Update(membership);
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
        public bool DeleteMembership(int id)
        {
            return membershipServices.Delete(id);
        }
    }
}
