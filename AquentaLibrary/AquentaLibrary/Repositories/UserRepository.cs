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
    public class UserRepository: GenericRepository<UserModel>
    {
        public bool AddUser(UserModel user)
        {
            return Add(user);
        }

        public bool DeleteUser(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all users using SP_GetAllUser
        /// </summary>
        public IEnumerable<UserModel> GetAllUser()
        {
            var parameters = new DynamicParameters();
            return dbConnection.Query<UserModel>(
                "SP_GetAllUser",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get user by ID using SP_GetUserById
        /// </summary>
        public UserModel GetUserById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@UserID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<UserModel>(
                "SP_GetUserById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get user by username using SP_GetUserByUsername (for login)
        /// </summary>
        public UserModel GetUserByUsername(string username)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Username", username, DbType.String);

            return dbConnection.QueryFirstOrDefault<UserModel>(
                "SP_GetUserByUsername",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert user using SP_InsertUser
        /// </summary>
        public int InsertUser(UserModel user)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@Username", user.UserName, DbType.String);
            parameters.Add("@Pass", user.Pass, DbType.String);
            parameters.Add("@FirstName", user.FirstName, DbType.String);
            parameters.Add("@LastName", user.LastName, DbType.String);
            parameters.Add("@UserRole", user.UserRole, DbType.String);

            return dbConnection.QuerySingle<int>(
                "SP_InsertUser",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update user using SP_UpdateUser
        /// </summary>
        public int UpdateUserSP(UserModel user)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@UserID", user.UserId, DbType.Int32);
            parameters.Add("@Username", user.UserName, DbType.String);
            parameters.Add("@Pass", user.Pass, DbType.String);
            parameters.Add("@FirstName", user.FirstName, DbType.String);
            parameters.Add("@LastName", user.LastName, DbType.String);
            parameters.Add("@UserRole", user.UserRole, DbType.String);

            return dbConnection.Execute(
                "SP_UpdateUser",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Soft delete user using SP_DeleteUser
        /// </summary>
        public int DeleteUserSoft(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@UserID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteUser",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Permanent delete user using SP_DeleteUserPermanent
        /// </summary>
        public int DeleteUserPermanent(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@UserID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteUserPermanent",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdateUser(UserModel user)
        {
            return Update(user);
        }
    }
}
