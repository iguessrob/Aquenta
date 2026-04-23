using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class CategoryServices
    {
        private CategoryRepository categoryRepo = new CategoryRepository();

        public IEnumerable<CategoryModel> GetAll()
        {
            return categoryRepo.GetAllCategory();
        }

        public CategoryModel GetbyId(int id)
        {
            return categoryRepo.GetCategoryById(id);
        }

        public bool Add(CategoryModel category)
        {
            return categoryRepo.AddCategory(category);
        }

        public bool Update(CategoryModel category)
        {
            return categoryRepo.UpdateCategory(category);
        }

        public bool Delete(int id)
        {
            return categoryRepo.DeleteCategory(id);
        }
    }
}
