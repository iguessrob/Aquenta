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
        public ActionResult<bool> AddCategory(CategoryModel category)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(categoryServices.Add(category));
        }

        [HttpPut]
        public ActionResult<bool> UpdateCategory(CategoryModel category)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(categoryServices.Update(category));
        }

        [HttpGet]
        public ActionResult GetAllCategory()
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var user = categoryServices.GetAll();
            return Ok(user);
        }

        [HttpGet("{id}")]
        public ActionResult GetByCategoryId(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");

            var category = categoryServices.GetbyId(id);
            if (category == null) return NotFound("Category not found.");
            return Ok(category);
        }

        [HttpDelete]
        public ActionResult<bool> DeleteCategory(int id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString();
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return Unauthorized("Administrative privileges required.");
            return Ok(categoryServices.Delete(id));
        }
    }
}
