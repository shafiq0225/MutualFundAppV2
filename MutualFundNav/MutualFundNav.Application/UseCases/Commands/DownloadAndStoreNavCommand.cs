using System.Security.Cryptography;
using System.Text;
using MutualFundNav.Domain.Common;
using MutualFundNav.Domain.Contracts;
using MutualFundNav.Domain.Entities;
using MutualFundNav.Domain.Enums;
using MutualFundNav.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace MutualFundNav.Application.UseCases.Commands
{
    public class DownloadAndStoreNavCommand
    {
        private readonly INavDownloadService _downloadService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IKafkaPublisher<NavFileProcessedEvent> _kafkaPublisher;
        private readonly ILogger<DownloadAndStoreNavCommand> _logger;

        public DownloadAndStoreNavCommand(
            INavDownloadService downloadService,
            IUnitOfWork unitOfWork,
            IKafkaPublisher<NavFileProcessedEvent> kafkaPublisher,
            ILogger<DownloadAndStoreNavCommand> logger)
        {
            _downloadService = downloadService;
            _unitOfWork = unitOfWork;
            _kafkaPublisher = kafkaPublisher;
            _logger = logger;
        }

        public async Task<Result<bool>> ExecuteAsync(
            DateTime targetDate,
            string kafkaTopic = "nav-file-processed",
            CancellationToken ct = default)
        {
            _logger.LogInformation("Checking if NAV data exists for {Date}",
                targetDate.ToString("yyyy-MM-dd"));

            // ── Idempotency check ──────────────────────────────────────────
            if (await _unitOfWork.NavFiles.ExistsByDateAsync(targetDate))
            {
                _logger.LogInformation("NAV data already exists for {Date}",
                    targetDate.ToString("yyyy-MM-dd"));
                return Result<bool>.Success(false);
            }

            // ── Download ───────────────────────────────────────────────────
            _logger.LogInformation("Downloading NAV data for {Date}",
                targetDate.ToString("yyyy-MM-dd"));

            var (status, content, errorMessage, recordCount) =
                await _downloadService.DownloadNavDataAsync();

            if (status != DownloadStatus.Success)
            {
                _logger.LogError("Download failed: {Error}", errorMessage);
                return Result<bool>.Failure(errorMessage ?? "Download failed");
            }

            var checksum = ComputeChecksum(content);

            // ── Store ──────────────────────────────────────────────────────
            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var navFile = new NavFile
                {
                    NavDate = targetDate,
                    FileContent = content,
                    FileSizeBytes = (long)Encoding.UTF8.GetByteCount(content),
                    RecordCount = recordCount,
                    Checksum = checksum,
                    DownloadedAt = DateTime.UtcNow
                };

                await _unitOfWork.NavFiles.AddAsync(navFile);
                await _unitOfWork.CompleteAsync();
                await _unitOfWork.CommitTransactionAsync();

                _logger.LogInformation(
                    "Stored NAV file for {Date} — {Size} bytes, {Records} records",
                    targetDate.ToString("yyyy-MM-dd"), navFile.FileSizeBytes, recordCount);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Storage failed for {Date}",
                    targetDate.ToString("yyyy-MM-dd"));
                return Result<bool>.Failure($"Storage failed: {ex.Message}");
            }

            // ── Publish to Kafka ───────────────────────────────────────────
            try
            {
                var navEvent = new NavFileProcessedEvent
                {
                    NavDate = targetDate,
                    FileContent = content,
                    RecordCount = recordCount,
                    Checksum = checksum,
                    PublishedAt = DateTime.UtcNow
                };

                await _kafkaPublisher.PublishAsync(
                    topic: kafkaTopic,
                    key: targetDate.ToString("yyyy-MM-dd"),
                    message: navEvent,
                    ct: ct);

                _logger.LogInformation(
                    "Published NavFileProcessedEvent to Kafka topic '{Topic}' for {Date} ({Count} records)",
                    kafkaTopic, targetDate.ToString("yyyy-MM-dd"), recordCount);
            }
            catch (Exception ex)
            {
                // Publish failure is non-critical — NAV data is already persisted
                _logger.LogWarning(ex,
                    "NAV saved but Kafka publish failed for {Date}. Consumers will miss this event.",
                    targetDate.ToString("yyyy-MM-dd"));
            }

            return Result<bool>.Success(true);
        }

        private static string ComputeChecksum(string content)
        {
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(content));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }
    }
}
