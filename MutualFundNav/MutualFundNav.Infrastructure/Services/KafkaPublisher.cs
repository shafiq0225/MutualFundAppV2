using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MutualFundNav.Domain.Interfaces;

namespace MutualFundNav.Infrastructure.Services
{
    public class KafkaPublisher<T> : IKafkaPublisher<T>, IDisposable
    {
        private readonly IProducer<string, string> _producer;
        private readonly ILogger<KafkaPublisher<T>> _logger;

        public KafkaPublisher(IConfiguration configuration, ILogger<KafkaPublisher<T>> logger)
        {
            _logger = logger;

            var config = new ProducerConfig
            {
                BootstrapServers    = configuration["Kafka:BootstrapServers"] ?? "localhost:9092",
                Acks                = Acks.All,        // leader + ISR replicas must ack
                EnableIdempotence   = true,            // exactly-once per partition
                MessageSendMaxRetries = 3,
                RetryBackoffMs      = 1000,
                CompressionType     = CompressionType.Snappy
            };

            _producer = new ProducerBuilder<string, string>(config)
                .SetErrorHandler((_, e) =>
                    _logger.LogError("Kafka producer error: {Reason}", e.Reason))
                .Build();
        }

        public async Task PublishAsync(
            string topic, string key, T message, CancellationToken ct = default)
        {
            var json        = JsonSerializer.Serialize(message);
            var kafkaMsg    = new Message<string, string> { Key = key, Value = json };
            var result      = await _producer.ProduceAsync(topic, kafkaMsg, ct);

            _logger.LogInformation(
                "Published to Kafka | topic={Topic} | partition={Partition} | offset={Offset} | key={Key}",
                result.Topic, result.Partition.Value, result.Offset.Value, key);
        }

        public void Dispose()
        {
            _producer.Flush(TimeSpan.FromSeconds(5));
            _producer.Dispose();
        }
    }
}
