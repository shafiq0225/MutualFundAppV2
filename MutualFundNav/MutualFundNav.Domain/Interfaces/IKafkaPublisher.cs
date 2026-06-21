namespace MutualFundNav.Domain.Interfaces
{
    public interface IKafkaPublisher<T>
    {
        Task PublishAsync(string topic, string key, T message, CancellationToken ct = default);
    }
}
