using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PeriodController : Controller
    {
        PeriodServices periodServices = new PeriodServices();

        [HttpPost]
        public bool AddPeriod(PeriodModel period)
        {
            return periodServices.Add(period);
        }

        [HttpPut]
        public bool UpdatePeriod(PeriodModel period)
        {
            return periodServices.Update(period);
        }

        [HttpGet]
        public ActionResult GetAllPeriod()
        {
            var period = periodServices.GetAll();
            return Ok(period);
        }

        [HttpGet("{id}")]
        public PeriodModel GetPeriodById(int id)
        {
            return periodServices.GetbyId(id);
        }

        [HttpDelete]
        public bool DeletePeriod(int id)
        {
            return periodServices.Delete(id);
        }
    }
}
