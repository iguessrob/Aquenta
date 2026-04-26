using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AquentaLibrary.Repositories;

namespace AquentaLibrary.Services
{
    /// <summary>
    /// ReportService - Business logic layer for reports and analytics
    /// </summary>
    public class ReportServices
    {
        private readonly ReportRepository _reportRepository;

        public ReportServices(ReportRepository reportRepository)
        {
            _reportRepository = reportRepository;
        }

        // ==================== DASHBOARD AGGREGATES ====================

        public int GetTotalActiveConcessioners(string status = "Active")
        {
            return _reportRepository.GetTotalActiveConcessioners(status);
        }

        public int GetMonthlyWaterConsumption(DateTime startDate, DateTime endDate)
        {
            return _reportRepository.GetMonthlyWaterConsumption(startDate, endDate);
        }

        public decimal GetPendingCollections()
        {
            return _reportRepository.GetPendingCollections();
        }

        public decimal GetLatestMonthPendingCollections()
        {
            return _reportRepository.GetLatestMonthPendingCollections();
        }

        public decimal GetTotalMonthlyAccountReceivable()
        {
            return _reportRepository.GetTotalMonthlyAccountReceivable();
        }

        public decimal GetTotalMonthlyCollection()
        {
            return _reportRepository.GetTotalMonthlyCollection();
        }

        public decimal GetTotalAnnualAccountReceivable()
        {
            return _reportRepository.GetTotalAnnualAccountReceivable();
        }

        public int GetTotalConcessioners()
        {
            return _reportRepository.GetTotalConcessioners();
        }

        public dynamic GetTotalBillingByPeriod(int periodId)
        {
            return _reportRepository.GetTotalBillingByPeriod(periodId);
        }

        public dynamic GetTotalPaymentCollections(DateTime startDate, DateTime endDate)
        {
            return _reportRepository.GetTotalPaymentCollections(startDate, endDate);
        }

        public dynamic GetUnpaidBillsSummary()
        {
            return _reportRepository.GetUnpaidBillsSummary();
        }

        public dynamic GetOverdueBillsSummary()
        {
            return _reportRepository.GetOverdueBillsSummary();
        }

        public IEnumerable<dynamic> GetBillingProgressByZone(int periodId)
        {
            return _reportRepository.GetBillingProgressByZone(periodId);
        }

        public IEnumerable<dynamic> GetArrearSummaryReport()
        {
            return _reportRepository.GetArrearSummaryReport();
        }

        // ==================== NEW REFACTORED REPORTS (V3) ====================

        public dynamic GetTotalOverdueAmount()
        {
            return _reportRepository.GetTotalOverdueAmount();
        }

        // ==================== ADVANCED REPORTS ====================

        public IEnumerable<dynamic> GetDistrictConsumptionSummary()
        {
            return _reportRepository.GetDistrictConsumptionSummary();
        }

        public IEnumerable<dynamic> GetBillingWithPaymentSummary()
        {
            return _reportRepository.GetBillingWithPaymentSummary();
        }

        public IEnumerable<dynamic> GetActiveCustomerDebtAndUsageSummary()
        {
            return _reportRepository.GetActiveCustomerDebtAndUsageSummary();
        }

        public IEnumerable<dynamic> GetDelinquentCustomersReport()
        {
            return _reportRepository.GetDelinquentCustomersReport();
        }

        public IEnumerable<dynamic> GetCollectionPerformanceSummary(DateTime startDate, DateTime endDate)
        {
            return _reportRepository.GetCollectionPerformanceSummary(startDate, endDate);
        }

        public IEnumerable<dynamic> GetMonthlyRevenueReport(int year)
        {
            return _reportRepository.GetMonthlyRevenueReport(year);
        }

        public IEnumerable<dynamic> GetMonthlyConsumptionReport(int year)
        {
            return _reportRepository.GetMonthlyConsumptionReport(year);
        }

        public IEnumerable<dynamic> GetMonthlyWaterLossReport(int year)
        {
            return _reportRepository.GetMonthlyWaterLossReport(year);
        }

        public dynamic GetLatestMonthWaterDistributionSummary()
        {
            return _reportRepository.GetLatestMonthWaterDistributionSummary();
        }

        public dynamic GetLatestPeriodSelector()
        {
            return _reportRepository.GetLatestPeriodSelector();
        }

        public dynamic GetCustomerAccountDetailReport(int concessionerId)
        {
            return _reportRepository.GetCustomerAccountDetailReport(concessionerId);
        }

        public dynamic GetDashboardSummary()
        {
            return _reportRepository.GetDashboardSummary();
        }
    }
}
