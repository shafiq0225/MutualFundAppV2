using Microsoft.EntityFrameworkCore;
using MutualFund.Scheme.Domain.Entities;
using MutualFund.Scheme.Domain.Interfaces;
using MutualFund.Scheme.Infrastructure.Data;

namespace MutualFund.Scheme.Infrastructure.Repositories
{
    public class DetailedSchemeRepository : IDetailedSchemeRepository
    {
        private readonly ApplicationDbContext _context;

        public DetailedSchemeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsBySchemeCodeAndDateAsync(
            string schemeCode, DateTime navDate) =>
            await _context.DetailedSchemes
                .AnyAsync(d => d.SchemeCode == schemeCode
                            && d.NavDate == navDate.Date);

        public async Task AddRangeAsync(IEnumerable<DetailedScheme> schemes) =>
            await _context.DetailedSchemes.AddRangeAsync(schemes);

        public async Task<IEnumerable<string>> GetSchemeCodesByFundCodeAsync(
            string fundCode) =>
            await _context.DetailedSchemes
                .Where(d => d.FundCode == fundCode)
                .Select(d => d.SchemeCode)
                .Distinct()
                .ToListAsync();

        public async Task UpdateApprovalByFundCodeAsync(
            string fundCode, bool isApproved)
        {
            var schemes = await _context.DetailedSchemes
                .Where(d => d.FundCode == fundCode)
                .ToListAsync();

            if (schemes.Count == 0) return;

            foreach (var scheme in schemes)
                scheme.IsApproved = isApproved;

            _context.DetailedSchemes.UpdateRange(schemes);
        }

        public async Task<IEnumerable<DetailedScheme>> GetByDateRangeWithPreviousAsync(
            DateTime startDate, DateTime endDate)
        {
            var inRange = await _context.DetailedSchemes
                .Where(d => d.IsApproved
                         && d.NavDate >= startDate.Date
                         && d.NavDate <= endDate.Date)
                .ToListAsync();

            var schemeCodes = inRange.Select(d => d.SchemeCode).Distinct().ToList();
            var previousRecords = new List<DetailedScheme>();

            foreach (var schemeCode in schemeCodes)
            {
                var previous = await _context.DetailedSchemes
                    .Where(d => d.SchemeCode == schemeCode
                             && d.NavDate < startDate.Date)
                    .OrderByDescending(d => d.NavDate)
                    .FirstOrDefaultAsync();

                if (previous != null)
                    previousRecords.Add(previous);
            }

            return inRange
                .Concat(previousRecords)
                .OrderBy(d => d.SchemeCode)
                .ThenBy(d => d.NavDate)
                .ToList();
        }

        public async Task<List<DateTime>> GetLastTradingDatesAsync(int count) =>
            await _context.DetailedSchemes
                .Where(d => d.IsApproved)
                .Select(d => d.NavDate)
                .Distinct()
                .OrderByDescending(d => d)
                .Take(count)
                .ToListAsync();

        public async Task<IEnumerable<DetailedScheme>> GetNavHistoryBySchemeCodeAsync(
            string schemeCode, DateTime fromDate) =>
            await _context.DetailedSchemes
                .Where(d => d.SchemeCode == schemeCode
                         && d.NavDate >= fromDate)
                .OrderByDescending(d => d.NavDate)
                .ToListAsync();
    }
}