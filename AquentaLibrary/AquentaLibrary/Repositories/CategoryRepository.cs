using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using Dapper;

namespace AquentaLibrary.Repositories
{
    public class CategoryRepository : GenericRepository<CategoryModel>
    {
        public bool AddCategory(CategoryModel category)
        {
            return Add(category);
        }

        public bool DeleteCategory(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all categories using SP_GetAllCategory
        /// </summary>
        public IEnumerable<CategoryModel> GetAllCategory()
        {
            return dbConnection.Query<CategoryModel>(
                "SP_GetAllCategory",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get category by ID using SP_GetCategoryById
        /// </summary>
        public CategoryModel GetCategoryById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@CategoryID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<CategoryModel>(
                "SP_GetCategoryById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert category using SP_InsertCategory
        /// </summary>
        public int InsertCategory(CategoryModel category)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@CategoryName", category.CategoryName, DbType.String);

            return dbConnection.QuerySingle<int>(
                "SP_InsertCategory",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update category using SP_UpdateCategory
        /// </summary>
        public int UpdateCategorySP(CategoryModel category)
        {
            var parameters = new DynamicParameters();
                parameters.Add("@CategoryId", category.CategoryId, DbType.Int32);
            parameters.Add("@CategoryName", category.CategoryName, DbType.String);

            return dbConnection.Execute(
                "SP_UpdateCategory",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Delete category using SP_DeleteCategory
        /// </summary>
        public int DeleteCategorySP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@CategoryID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteCategory",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdateCategory(CategoryModel category)
        {
            return Update(category);
        }

    }
}
