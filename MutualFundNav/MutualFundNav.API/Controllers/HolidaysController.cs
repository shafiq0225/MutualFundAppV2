using Microsoft.AspNetCore.Mvc;
using MutualFundNav.Domain.Interfaces;

namespace MutualFundNav.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class HolidaysController : ControllerBase
    {
        private readonly IDateHelper _dateHelper;
        private readonly INseHolidayFetcher _holidayFetcher;
        private readonly IUnitOfWork _uow;

        public HolidaysController(
            IDateHelper dateHelper,
            INseHolidayFetcher holidayFetcher,
            IUnitOfWork uow)
        {
            _dateHelper = dateHelper;
            _holidayFetcher = holidayFetcher;
            _uow = uow;
        }

        /// <summary>Check if a given date is a market trading day.</summary>
        [HttpGet("is-trading-day")]
        public async Task<IActionResult> IsTradingDay([FromQuery] DateTime date)
        {
            var isTradingDay = await _dateHelper.IsTradingDayAsync(date);
            return Ok(new
            {
                date = date.ToString("yyyy-MM-dd"),
                isTradingDay,
                dayOfWeek = date.DayOfWeek.ToString()
            });
        }

        /// <summary>Force-refresh the NSE holiday cache.</summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshHolidays()
        {
            await _holidayFetcher.RefreshHolidaysAsync();
            return Ok(new { message = "Holiday cache refreshed" });
        }

        /// <summary>Get market holidays for the given year.</summary>
        [HttpGet("{year:int}")]
        public async Task<IActionResult> GetHolidaysForYear(int year)
        {
            var holidays = await _uow.MarketHolidays.GetHolidaysForYearAsync(year);
            return Ok(holidays.Select(h => new
            {
                date = h.HolidayDate.ToString("yyyy-MM-dd"),
                h.Description,
                h.Source
            }));
        }
    }
}
