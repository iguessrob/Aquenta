using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class MembershipServices
    {
        private MembershipRepository membershipRepo = new MembershipRepository();

        public IEnumerable<MembershipModel> GetAll()
        {
            return membershipRepo.GetAllMembership();
        }

        public MembershipModel GetbyId(int id)
        {
            return membershipRepo.GetMembershipById(id);
        }

        public bool Add(MembershipModel membership)
        {
            return membershipRepo.AddMembership(membership);
        }

        public bool Update(MembershipModel membership)
        {
            return membershipRepo.UpdateMembership(membership);
        }

        public bool Delete(int id)
        {
            return membershipRepo.DeleteMembership(id);
        }
    }
}
