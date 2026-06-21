using Microsoft.AspNetCore.Mvc;
using MutualFundNav.Application.UseCases.Commands;
using MutualFundNav.Domain.Interfaces;

namespace MutualFundNav.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class NavController : ControllerBase
    {
        private readonly DownloadAndStoreNavCommand _command;
        private readonly IDateHelper _dateHelper;
        private readonly IUnitOfWork _uow;
        private readonly IConfiguration _config;
        private readonly ILogger<NavController> _logger;

        public NavController(
            DownloadAndStoreNavCommand command,
            IDateHelper dateHelper,
            IUnitOfWork uow,
            IConfiguration config,
            ILogger<NavController> logger)
        {
            _command    = command;
            _dateHelper = dateHelper;
            _uow        = uow;
            _config     = config;
            _logger     = logger;
        }

        private string NavTopic =>
            _config["Kafka:Topics:NavFileProcessed"] ?? "nav-file-processed";

        /// <summary>
        /// Manually trigger a NAV download for the last trading date.
        /// Useful for re-runs, testing, and catch-up after a missed schedule.
        /// </summary>
        [HttpPost("trigger")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> TriggerDownload(CancellationToken ct)
        {
            var targetDate = await _dateHelper.GetTargetNavDateAsync();
            _logger.LogInformation("Manual trigger for NAV date {Date}",
                targetDate.ToString("yyyy-MM-dd"));

            var result = await _command.ExecuteAsync(targetDate, NavTopic, ct);

            return result.IsSuccess
                ? Ok(new
                  {
                      date      = targetDate.ToString("yyyy-MM-dd"),
                      wasStored = result.Data,
                      message   = result.Data
                                    ? "NAV downloaded and stored successfully"
                                    : "NAV data already exists for this date"
                  })
                : BadRequest(new { error = result.ErrorMessage });
        }

        /// <summary>
        /// Trigger a NAV download for a specific date (yyyy-MM-dd).
        /// </summary>
        [HttpPost("trigger/{date:datetime}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> TriggerDownloadForDate(DateTime date, CancellationToken ct)
        {
            _logger.LogInformation("Manual trigger for specific date {Date}",
                date.ToString("yyyy-MM-dd"));

            var result = await _command.ExecuteAsync(date, NavTopic, ct);

            return result.IsSuccess
                ? Ok(new { date = date.ToString("yyyy-MM-dd"), wasStored = result.Data })
                : BadRequest(new { error = result.ErrorMessage });
        }

        /// <summary>Returns the last trading date that would be downloaded.</summary>
        [HttpGet("target-date")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTargetDate()
        {
            var date = await _dateHelper.GetTargetNavDateAsync();
            return Ok(new { targetDate = date.ToString("yyyy-MM-dd") });
        }

        /// <summary>Returns the latest NAV date stored in the database.</summary>
        [HttpGet("latest")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetLatest()
        {
            var latest = await _uow.NavFiles.GetLatestDateAsync();
            return latest.HasValue
                ? Ok(new { latestNavDate = latest.Value.ToString("yyyy-MM-dd") })
                : NotFound(new { message = "No NAV data stored yet" });
        }

        /// <summary>Returns all stored NAV dates, most recent first.</summary>
        [HttpGet("dates")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllDates()
        {
            var dates = await _uow.NavFiles.GetAllDatesAsync();
            return Ok(dates.Select(d => d.ToString("yyyy-MM-dd")));
        }
    }
}
