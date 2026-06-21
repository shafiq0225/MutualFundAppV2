using MutualFundNav.Application.UseCases.Commands;
using MutualFundNav.Domain.Contracts;
using MutualFundNav.Domain.Entities;
using MutualFundNav.Domain.Interfaces;

namespace MutualFundNav.API.Workers
{
    /// <summary>
    /// Runs daily at the configured ScheduleTime (default 08:30 IST).
    /// Replaces the Quartz IJob from the console app.
    /// Uses IServiceScopeFactory because BackgroundService is singleton
    /// but the command and UoW are scoped.
    /// </summary>
    public class NavDownloadWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<NavDownloadWorker> _logger;

        public NavDownloadWorker(
            IServiceScopeFactory scopeFactory,
            IConfiguration config,
            ILogger<NavDownloadWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _config       = config;
            _logger       = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("NavDownloadWorker started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var next   = ComputeNextRun();
                    var delay  = next - DateTime.Now;
                    if (delay < TimeSpan.Zero) delay = TimeSpan.Zero;

                    _logger.LogInformation(
                        "Next NAV download scheduled at {NextRun} (in {Delay:hh\\:mm\\:ss})",
                        next, delay);

                    await Task.Delay(delay, stoppingToken);

                    if (!stoppingToken.IsCancellationRequested)
                        await RunJobAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogCritical(ex, "NavDownloadWorker loop fault — restarting in 60s");
                    await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
                }
            }

            _logger.LogInformation("NavDownloadWorker stopped");
        }

        // ─────────────────────────────────────────────────────────────────
        private async Task RunJobAsync(CancellationToken ct)
        {
            var startedAt = DateTime.UtcNow;
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            bool success  = false;
            string? error = null;

            _logger.LogInformation("========== NavDownloadWorker Job Started at {Time} ==========",
                DateTime.Now);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var sp          = scope.ServiceProvider;

                var dateHelper  = sp.GetRequiredService<IDateHelper>();
                var command     = sp.GetRequiredService<DownloadAndStoreNavCommand>();
                var uow         = sp.GetRequiredService<IUnitOfWork>();
                var kafkaPublisher = sp.GetRequiredService<IKafkaPublisher<MarketHolidayEvent>>();

                // ── Step 1: Holiday detection ──────────────────────────────
                await PublishHolidayIfTodayIsHolidayAsync(dateHelper, kafkaPublisher);

                // ── Step 2: NAV download ───────────────────────────────────
                var targetDate = await dateHelper.GetTargetNavDateAsync();
                _logger.LogInformation("Target NAV date: {Date}", targetDate.ToString("yyyy-MM-dd"));

                var result = await command.ExecuteAsync(
                    targetDate,
                    kafkaTopic: _config["Kafka:Topics:NavFileProcessed"] ?? "nav-file-processed",
                    ct: ct);

                if (result.IsSuccess)
                {
                    success = true;
                    _logger.LogInformation(result.Data
                        ? "NAV downloaded and stored successfully for {Date}"
                        : "NAV data already exists for {Date}",
                        targetDate.ToString("yyyy-MM-dd"));
                }
                else
                {
                    error = result.ErrorMessage;
                    _logger.LogError("Command failed: {Error}", error);
                }

                // ── Step 3: Persist job log ────────────────────────────────
                stopwatch.Stop();
                await PersistJobLogAsync(uow, startedAt, stopwatch.Elapsed, success, error);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                error = ex.Message;
                _logger.LogCritical(ex, "Unexpected error in NavDownloadWorker job");

                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var uow         = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                    await PersistJobLogAsync(uow, startedAt, stopwatch.Elapsed, false, ex.Message);
                }
                catch (Exception logEx)
                {
                    _logger.LogError(logEx, "Failed to persist job error log");
                }
            }
            finally
            {
                _logger.LogInformation(
                    "========== Job Completed — Success: {Success}, Elapsed: {Elapsed:F2}s ==========",
                    success, stopwatch.Elapsed.TotalSeconds);
            }
        }

        private async Task PublishHolidayIfTodayIsHolidayAsync(
            IDateHelper dateHelper,
            IKafkaPublisher<MarketHolidayEvent> kafkaPublisher)
        {
            var today = DateTime.Today;
            if (today.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) return;

            bool isTradingDay = await dateHelper.IsTradingDayAsync(today);
            if (isTradingDay) return;

            _logger.LogInformation(
                "Today ({Date}) is a market holiday — publishing MarketHolidayEvent to Kafka",
                today.ToString("yyyy-MM-dd"));

            try
            {
                var topic = _config["Kafka:Topics:MarketHoliday"] ?? "market-holidays";
                await kafkaPublisher.PublishAsync(
                    topic:   topic,
                    key:     today.ToString("yyyy-MM-dd"),
                    message: new MarketHolidayEvent
                    {
                        HolidayDate = today,
                        PublishedAt = DateTime.UtcNow
                    });
            }
            catch (Exception ex)
            {
                // Non-critical — holiday publish failure must not block NAV download
                _logger.LogWarning(ex, "Failed to publish MarketHolidayEvent for {Date}",
                    today.ToString("yyyy-MM-dd"));
            }
        }

        private static async Task PersistJobLogAsync(
            IUnitOfWork uow,
            DateTime startedAt,
            TimeSpan elapsed,
            bool success,
            string? error)
        {
            var log = new JobExecutionLog
            {
                JobName        = "NavDownloadWorker",
                StartedAt      = startedAt,
                CompletedAt    = DateTime.UtcNow,
                IsSuccess      = success,
                ErrorMessage   = error,
                ElapsedSeconds = elapsed.TotalSeconds
            };

            await uow.JobLogs.AddAsync(log);
            await uow.CompleteAsync();
        }

        private DateTime ComputeNextRun()
        {
            var scheduleTime = TimeSpan.Parse(
                _config["AppSettings:ScheduleTime"] ?? "08:30:00");

            var next = DateTime.Today.Add(scheduleTime);
            if (DateTime.Now >= next)
                next = next.AddDays(1);

            return next;
        }
    }
}
