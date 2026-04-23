using Microsoft.AspNetCore.Mvc;
using AquentaLibrary.Services;
using System;
using System.Collections.Generic;

namespace AquentaAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly ReportServices _reportServices = new ReportServices(new AquentaLibrary.Repositories.ReportRepository());

        // ==================== DASHBOARD ENDPOINTS ====================

        /// <summary>
        /// Get complete dashboard summary with all key metrics
        /// GET: /api/report/dashboard
        /// </summary>
        [HttpGet("dashboard")]
        public ActionResult<dynamic> GetDashboardSummary()
        {
            try
            {
                var summary = _reportServices.GetDashboardSummary();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get total active concessioners
        /// GET: /api/report/active-concessioners?status=Active
        /// </summary>
        [HttpGet("active-concessioners")]
        public ActionResult<int> GetTotalActiveConcessioners(string status = "Active")
        {
            try
            {
                var total = _reportServices.GetTotalActiveConcessioners(status);
                return Ok(total);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get total concessioners count
        /// GET: /api/report/total-concessioners
        /// </summary>
        [HttpGet("total-concessioners")]
        public ActionResult<int> GetTotalConcessioners()
        {
            try
            {
                var total = _reportServices.GetTotalConcessioners();
                return Ok(total);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get monthly water consumption
        /// GET: /api/report/water-consumption?startDate=2026-03-01&endDate=2026-04-01
        /// </summary>
        [HttpGet("water-consumption")]
        public ActionResult<int> GetMonthlyWaterConsumption(DateTime startDate, DateTime endDate)
        {
            try
            {
                var consumption = _reportServices.GetMonthlyWaterConsumption(startDate, endDate);
                return Ok(consumption);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get pending collections (unpaid bills amount)
        /// GET: /api/report/pending-collections
        /// </summary>
        [HttpGet("pending-collections")]
        public ActionResult<decimal> GetPendingCollections()
        {
            try
            {
                var pending = _reportServices.GetPendingCollections();
                return Ok(pending);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get latest month pending collections
        /// GET: /api/report/latest-month-pending-collections
        /// </summary>
        [HttpGet("latest-month-pending-collections")]
        public ActionResult<decimal> GetLatestMonthPendingCollections()
        {
            try
            {
                var pending = _reportServices.GetLatestMonthPendingCollections();
                return Ok(pending);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get total monthly account receivable
        /// GET: /api/report/total-monthly-account-receivable
        /// </summary>
        [HttpGet("total-monthly-account-receivable")]
        public ActionResult<decimal> GetTotalMonthlyAccountReceivable()
        {
            try
            {
                var total = _reportServices.GetTotalMonthlyAccountReceivable();
                return Ok(total);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get total monthly collection
        /// GET: /api/report/total-monthly-collection
        /// </summary>
        [HttpGet("total-monthly-collection")]
        public ActionResult<decimal> GetTotalMonthlyCollection()
        {
            try
            {
                var total = _reportServices.GetTotalMonthlyCollection();
                return Ok(total);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get total annual account receivable
        /// GET: /api/report/total-annual-account-receivable
        /// </summary>
        [HttpGet("total-annual-account-receivable")]
        public ActionResult<decimal> GetTotalAnnualAccountReceivable()
        {
            try
            {
                var total = _reportServices.GetTotalAnnualAccountReceivable();
                return Ok(total);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get unpaid bills summary
        /// GET: /api/report/unpaid-summary
        /// </summary>
        [HttpGet("unpaid-summary")]
        public ActionResult<dynamic> GetUnpaidBillsSummary()
        {
            try
            {
                var summary = _reportServices.GetUnpaidBillsSummary();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get overdue bills summary
        /// GET: /api/report/overdue-summary
        /// </summary>
        [HttpGet("overdue-summary")]
        public ActionResult<dynamic> GetOverdueBillsSummary()
        {
            try
            {
                var summary = _reportServices.GetOverdueBillsSummary();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get billing progress by district for a specific period.
        /// GET: /api/report/billing-progress-by-zone?periodId=3
        /// </summary>
        [HttpGet("billing-progress-by-zone")]
        public ActionResult<IEnumerable<dynamic>> GetBillingProgressByZone(int periodId)
        {
            try
            {
                if (periodId <= 0)
                {
                    return BadRequest(new { message = "periodId must be greater than 0." });
                }

                var progress = _reportServices.GetBillingProgressByZone(periodId);
                return Ok(progress);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get arrear summary for unpaid and overdue balances (including current month).
        /// GET: /api/report/arrear-summary
        /// </summary>
        [HttpGet("arrear-summary")]
        public ActionResult<IEnumerable<dynamic>> GetArrearSummaryReport()
        {
            try
            {
                var arrears = _reportServices.GetArrearSummaryReport();
                return Ok(arrears);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get total billing by period
        /// GET: /api/report/billing-by-period/3
        /// </summary>
        [HttpGet("billing-by-period/{periodId}")]
        public ActionResult<dynamic> GetTotalBillingByPeriod(int periodId)
        {
            try
            {
                var billing = _reportServices.GetTotalBillingByPeriod(periodId);
                return Ok(billing);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get total payment collections in date range
        /// GET: /api/report/payment-collections?startDate=2026-01-01&endDate=2026-12-31
        /// </summary>
        [HttpGet("payment-collections")]
        public ActionResult<dynamic> GetTotalPaymentCollections(DateTime startDate, DateTime endDate)
        {
            try
            {
                var collections = _reportServices.GetTotalPaymentCollections(startDate, endDate);
                return Ok(collections);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ==================== ADVANCED REPORT ENDPOINTS ====================

        /// <summary>
        /// Get monthly water consumption report for specific year
        /// Purpose: Shows consumption across all months
        /// GET: /api/report/consumption/{year}
        /// </summary>
        [HttpGet("consumption/{year}")]
        public ActionResult<IEnumerable<dynamic>> GetMonthlyConsumptionReport(int year)
        {
            try
            {
                var consumption = _reportServices.GetMonthlyConsumptionReport(year);
                return Ok(consumption);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get monthly water loss report for specific year.
        /// WaterLoss = MotherMeterConsumption - ConcessionerConsumption
        /// GET: /api/report/consumption-water-loss/{year}
        /// </summary>
        [HttpGet("consumption-water-loss/{year}")]
        public ActionResult<IEnumerable<dynamic>> GetMonthlyWaterLossReport(int year)
        {
            try
            {
                var report = _reportServices.GetMonthlyWaterLossReport(year);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get latest-month water distribution summary for dashboard cards.
        /// Includes MotherMeterConsumption, ConcessionerConsumption, UnaccountedWater.
        /// GET: /api/report/latest-month-water-distribution
        /// </summary>
        [HttpGet("latest-month-water-distribution")]
        public ActionResult<dynamic> GetLatestMonthWaterDistributionSummary()
        {
            try
            {
                var summary = _reportServices.GetLatestMonthWaterDistributionSummary();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get latest billing period selector using PeriodEnd basis.
        /// GET: /api/report/latest-period-selector
        /// </summary>
        [HttpGet("latest-period-selector")]
        public ActionResult<dynamic> GetLatestPeriodSelector()
        {
            try
            {
                var selector = _reportServices.GetLatestPeriodSelector();
                return Ok(selector);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get district consumption summary (identifies highest water usage districts)
        /// GET: /api/report/district-consumption
        /// </summary>
        [HttpGet("district-consumption")]
        public ActionResult<IEnumerable<dynamic>> GetDistrictConsumptionSummary()
        {
            try
            {
                var districts = _reportServices.GetDistrictConsumptionSummary();
                return Ok(districts);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get comprehensive billing with payment summary
        /// GET: /api/report/billing-summary
        /// </summary>
        [HttpGet("billing-summary")]
        public ActionResult<IEnumerable<dynamic>> GetBillingWithPaymentSummary()
        {
            try
            {
                var billing = _reportServices.GetBillingWithPaymentSummary();
                return Ok(billing);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get active customers with debt and water usage
        /// GET: /api/report/active-customers-debt
        /// </summary>
        [HttpGet("active-customers-debt")]
        public ActionResult<IEnumerable<dynamic>> GetActiveCustomerDebtAndUsageSummary()
        {
            try
            {
                var customers = _reportServices.GetActiveCustomerDebtAndUsageSummary();
                return Ok(customers);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get delinquent customers report
        /// GET: /api/report/delinquent-customers
        /// </summary>
        [HttpGet("delinquent-customers")]
        public ActionResult<IEnumerable<dynamic>> GetDelinquentCustomersReport()
        {
            try
            {
                var delinquent = _reportServices.GetDelinquentCustomersReport();
                return Ok(delinquent);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get collection performance by admin/collector
        /// GET: /api/report/collection-performance?startDate=2026-01-01&endDate=2026-12-31
        /// </summary>
        [HttpGet("collection-performance")]
        public ActionResult<IEnumerable<dynamic>> GetCollectionPerformanceSummary(DateTime startDate, DateTime endDate)
        {
            try
            {
                var performance = _reportServices.GetCollectionPerformanceSummary(startDate, endDate);
                return Ok(performance);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get monthly revenue report for specific year
        /// GET: /api/report/revenue/2026
        /// </summary>
        [HttpGet("revenue/{year}")]
        public ActionResult<IEnumerable<dynamic>> GetMonthlyRevenueReport(int year)
        {
            try
            {
                var revenue = _reportServices.GetMonthlyRevenueReport(year);
                return Ok(revenue);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get customer account detail report
        /// GET: /api/report/customer-detail/5
        /// </summary>
        [HttpGet("customer-detail/{concessionerId}")]
        public ActionResult<dynamic> GetCustomerAccountDetailReport(int concessionerId)
        {
            try
            {
                var detail = _reportServices.GetCustomerAccountDetailReport(concessionerId);
                if (detail == null)
                {
                    return NotFound(new { message = "Customer not found" });
                }
                return Ok(detail);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
