using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Models;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    public class PaymentServices
    {
        private PaymentRepository paymentRepo = new PaymentRepository();

        public IEnumerable<PaymentModel> GetAll()
        {
            return paymentRepo.GetAllPayment();
        }

        public PaymentModel GetbyId(int id)
        {
            return paymentRepo.GetPaymentById(id);
        }

        public bool Add(PaymentModel payment)
        {
            return paymentRepo.AddPayment(payment);
        }

        public bool Update(PaymentModel payment)
        {
            return paymentRepo.UpdatePayment(payment);
        }

        public bool Delete(int id)
        {
            return paymentRepo.DeletePayment(id);
        }

        public IEnumerable<PaymentModel> GetPaymentsByConcessionerId(int concessionerId)
        {
            return paymentRepo.GetPaymentsByConcessionerId(concessionerId);
        }
        public IEnumerable<dynamic> DistributePayment(int concessionerId, decimal amountPaid, int currentBillingId)
        {
            return paymentRepo.DistributePayment(concessionerId, amountPaid, currentBillingId);
        }

        public IEnumerable<dynamic> ReverseDistribution(int concessionerId)
        {
            return paymentRepo.ReverseDistribution(concessionerId);
        }
    }
}
