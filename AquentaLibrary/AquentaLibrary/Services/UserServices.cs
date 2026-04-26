using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

using BCrypt.Net;

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
            return userRepo.GetbyId(id);
        }

        public bool Add(UserModel user)
        {
            if (!string.IsNullOrWhiteSpace(user.Pass))
            {
                user.Pass = BCrypt.Net.BCrypt.EnhancedHashPassword(user.Pass);
            }
            return userRepo.AddUser(user);
        }

        public bool Update(UserModel user)
        {
            if (!string.IsNullOrWhiteSpace(user.Pass))
            {
                // Only hash if it's not already hashed (to avoid double hashing if Update is called twice)
                // BCrypt hashes start with $2
                if (!user.Pass.StartsWith("$2"))
                {
                    user.Pass = BCrypt.Net.BCrypt.EnhancedHashPassword(user.Pass);
                }
            }
            return userRepo.UpdateUser(user);
        }

        public bool Delete(int id)
        {
            return userRepo.DeleteUser(id);
        }
    }
}
