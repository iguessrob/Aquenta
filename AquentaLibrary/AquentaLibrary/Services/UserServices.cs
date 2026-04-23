using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class UserServices
    {
        private UserRepository userRepo = new UserRepository();

        public IEnumerable<UserModel> GetAll()
        {
            return userRepo.GetAllUser();
        }

        public UserModel GetbyId(int id)
        {
            return userRepo.GetUserById(id);
        }

        public bool Add(UserModel user)
        {
            return userRepo.AddUser(user);
        }

        public bool Update(UserModel user)
        {
            return userRepo.UpdateUser(user);
        }

        public bool Delete(int id)
        {
            return userRepo.DeleteUser(id);
        }
    }
}
