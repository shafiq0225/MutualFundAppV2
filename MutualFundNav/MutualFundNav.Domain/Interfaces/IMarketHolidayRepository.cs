using MutualFundNav.Domain.Entities;

namespace MutualFundNav.Domain.Interfaces
{
    public interface IMarketHolidayRepository
    {
        Task<bool> IsHolidayAsync(DateTime date);
        Task AddAsync(MarketHoliday holiday);
        Task<IEnumerable<MarketHoliday>> GetHolidaysForYearAsync(int year);
    }
}
