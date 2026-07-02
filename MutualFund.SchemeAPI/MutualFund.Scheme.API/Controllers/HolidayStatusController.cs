using Microsoft.AspNetCore.Mvc;
using MutualFund.Scheme.Application.UseCases.Queries;

namespace MutualFund.Scheme.API.Controllers
{
    [ApiController]
    [Route("api/holiday-status")]
    public class HolidayStatusController : ControllerBase
    {
        private readonly GetHolidayStatusQuery _query;

        public HolidayStatusController(GetHolidayStatusQuery query)
        {
            _query = query;
        }

        [HttpGet]
        public async Task<IActionResult> GetTodayStatus()
        {
            var result = await _query.ExecuteAsync();
            return Ok(result);
        }
    }
}