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
    public class MembershipRepository : GenericRepository<MembershipModel>
    {
        public bool AddMembership(MembershipModel membership)
        {
            return Add(membership);
        }

        public bool DeleteMembership(int id)
        {
            return Delete(id);
        }

        /// <summary>
        /// Get all memberships using SP_GetAllMembership
        /// </summary>
        public IEnumerable<MembershipModel> GetAllMembership()
        {
            return dbConnection.Query<MembershipModel>(
                "SP_GetAllMembership",
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Get membership by ID using SP_GetMembershipById
        /// </summary>
        public MembershipModel GetMembershipById(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@MembershipID", id, DbType.Int32);

            return dbConnection.QueryFirstOrDefault<MembershipModel>(
                "SP_GetMembershipById",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Insert membership using SP_InsertMembership
        /// </summary>
        public int InsertMembership(MembershipModel membership)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@MembershipName", membership.MembershipName, DbType.String);
            parameters.Add("@DiscountRate", membership.DiscountRate, DbType.Decimal);

            return dbConnection.QuerySingle<int>(
                "SP_InsertMembership",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Update membership using SP_UpdateMembership
        /// </summary>
        public int UpdateMembershipSP(MembershipModel membership)
        {
            var parameters = new DynamicParameters();
                parameters.Add("@MembershipID", membership.MembershipId, DbType.Int32);
            parameters.Add("@MembershipName", membership.MembershipName, DbType.String);
            parameters.Add("@DiscountRate", membership.DiscountRate, DbType.Decimal);

            return dbConnection.Execute(
                "SP_UpdateMembership",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        /// <summary>
        /// Delete membership using SP_DeleteMembership
        /// </summary>
        public int DeleteMembershipSP(int id)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@MembershipID", id, DbType.Int32);

            return dbConnection.Execute(
                "SP_DeleteMembership",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public bool UpdateMembership(MembershipModel membership)
        {
            return Update(membership);
        }
    }
}
