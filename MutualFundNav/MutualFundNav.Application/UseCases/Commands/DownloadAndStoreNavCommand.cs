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
    /// <summary>
    /// Downloads NAV data for <paramref name="targetDate"/> and inserts it if it does not already
    /// exist (idempotent). Publishes a <see cref="NavFileProcessedEvent"/> to Kafka and persists
    /// a <see cref="KafkaPublishLog"/> row regardless of publish outcome.
    /// </summary>
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

        /// <param name="targetDate">The NAV date to download and store.</param>
        /// <param name="kafkaTopic">Topic to publish to.</param>
        /// <param name="triggerSource">
        ///   Identifies what initiated this call — stored in <see cref="KafkaPublishLog.TriggerSource"/>.
        ///   Examples: "NavDownloadWorker.Scheduled", "NavController.ManualTrigger".
        /// </param>
        /// <param name="ct">Cancellation token.</param>
        /// <returns>
        ///   Success(true)  — downloaded and stored.
        ///   Success(false) — already existed, skipped.
        ///   Failure(msg)   — download or storage error.
        /// </returns>
        public async Task<Result<bool>> ExecuteAsync(
            DateTime targetDate,
            string kafkaTopic = "nav-file-processed",
            CancellationToken ct = default,
            string triggerSource = "Unknown")
        {
            _logger.LogInformation("Checking if NAV data exists for {Date}",
                targetDate.ToString("yyyy-MM-dd"));

            // ── Idempotency check ──────────────────────────────────────────
            if (await _unitOfWork.NavFiles.ExistsByDateAsync(targetDate))
            {
                _logger.LogInformation("NAV data already exists for {Date} — skipping",
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

            // ── Store (transactional) ──────────────────────────────────────
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
                await _unitOfWork.CommitTransactionAsync();  // disposes + nulls _transaction

                _logger.LogInformation(
                    "Stored NAV file for {Date} — {Size} bytes, {Records} records",
                    targetDate.ToString("yyyy-MM-dd"), navFile.FileSizeBytes, recordCount);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Storage failed for {Date}", targetDate.ToString("yyyy-MM-dd"));
                return Result<bool>.Failure($"Storage failed: {ex.Message}");
            }

            // ── Publish to Kafka ───────────────────────────────────────────
            // PublishAsync never throws — failures come back in the result.
            var messageKey = targetDate.ToString("yyyy-MM-dd");

            var publishResult = await _kafkaPublisher.PublishAsync(
                topic: kafkaTopic,
                key: messageKey,
                message: new NavFileProcessedEvent
                {
                    NavDate = targetDate,
                    FileContent = content,
                    RecordCount = recordCount,
                    Checksum = checksum,
                    PublishedAt = DateTime.UtcNow
                },
                ct: ct);

            if (!publishResult.IsSuccess)
            {
                _logger.LogWarning(
                    "NAV saved but Kafka publish failed for {Date}: {Error}",
                    targetDate.ToString("yyyy-MM-dd"), publishResult.ErrorMessage);
            }

            // ── Persist Kafka publish log ──────────────────────────────────
            // Uses the same UoW (DbContext) after transaction is committed + disposed.
            // Saved as a plain (non-transactional) SaveChanges — if this fails it
            // does not affect the already-committed NAV data.
            try
            {
                var kafkaLog = new KafkaPublishLog
                {
                    Topic = kafkaTopic,
                    EventType = "NavFileProcessed",
                    MessageKey = messageKey,
                    MessageSizeBytes = publishResult.MessageSizeBytes,
                    IsSuccess = publishResult.IsSuccess,
                    ErrorMessage = publishResult.ErrorMessage,
                    PublishedAt = DateTime.UtcNow,
                    ElapsedMs = publishResult.ElapsedMs,
                    TriggerSource = triggerSource,
                    NavDate = targetDate,
                    Partition = publishResult.Partition,
                    Offset = publishResult.Offset
                };

                await _unitOfWork.KafkaPublishLogs.AddAsync(kafkaLog);
                await _unitOfWork.CompleteAsync();
            }
            catch (Exception logEx)
            {
                _logger.LogError(logEx, "Failed to persist KafkaPublishLog for {Date}",
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