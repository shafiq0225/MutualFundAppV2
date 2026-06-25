using MutualFundNav.Domain.Entities;

namespace MutualFundNav.Domain.Interfaces
{
    public interface INavFileRepository
    {
        Task<bool> ExistsByDateAsync(DateTime date);
        Task AddAsync(NavFile navFile);
        Task UpdateAsync(NavFile navFile);
        Task<NavFile?> GetByDateAsync(DateTime date);
        Task<IEnumerable<DateTime>> GetAllDatesAsync();
        Task<DateTime?> GetLatestDateAsync();
        Task<NavFile?> GetLatestAsync();
    }
}