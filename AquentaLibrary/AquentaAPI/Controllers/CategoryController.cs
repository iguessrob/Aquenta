using AquentaLibrary.Models;
using AquentaLibrary.Services;
using Microsoft.AspNetCore.Mvc;

namespace AquentaAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : Controller
    {
        CategoryServices categoryServices = new CategoryServices();

        [HttpPost]
        public bool AddCategory(CategoryModel category)
        {
            return categoryServices.Add(category);
        }

        [HttpPut]
        public bool UpdateCategory(CategoryModel category)
        {
            return categoryServices.Update(category);
        }

        [HttpGet]
        public ActionResult GetAllCategory()
        {
            var user = categoryServices.GetAll();
            return Ok(user);
        }

        [HttpGet("{id}")]
        public CategoryModel GetByCategoryId(int id)
        {
            return categoryServices.GetbyId(id);
        }

        [HttpDelete]
        public bool DeleteCategory(int id)
        {
            return categoryServices.Delete(id);
        }
    }
}
