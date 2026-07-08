using MutualFund.Investment.Domain.Entities;
using MutualFund.Investment.Domain.Interfaces;
using MutualFund.Investment.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace MutualFund.Investment.Infrastructure.Repositories
{
    public class PortfolioRepository : IPortfolioRepository
    {
        private readonly InvestmentDbContext _context;

        public PortfolioRepository(InvestmentDbContext context)
        {
            _context = context;
        }

        // ── Create ────────────────────────────────────────────────
        public async Task AddSnapshotAsync(PortfolioSnapshot snapshot)
        {
            await _context.PortfolioSnapshots.AddAsync(snapshot);
        }

        public async Task AddSnapshotRangeAsync(
            IEnumerable<PortfolioSnapshot> snapshots)
        {
            await _context.PortfolioSnapshots.AddRangeAsync(snapshots);
        }

        // ── Read ──────────────────────────────────────────────────
        public async Task<PortfolioSnapshot?> GetLatestByHoldingAsync(
            int holdingId)
        {
            return await _context.PortfolioSnapshots
                .Where(s => s.HoldingId == holdingId)
                .OrderByDescending(s => s.SnapshotDate)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<PortfolioSnapshot>> GetByInvestorAsync(
            string investorUserId,
            DateTime? date = null)
        {
            var targetDate = date?.Date ?? DateTime.UtcNow.Date;

            // Get all holdings for this investor
            var holdingIds = await _context.Holdings
                .Where(h => h.InvestorUserId == investorUserId && h.IsActive)
                .Select(h => h.Id)
                .ToListAsync();

            // For each holding, get the latest snapshot on or before targetDate
            var snapshots = new List<PortfolioSnapshot>();

            foreach (var holdingId in holdingIds)
            {
                var snapshot = await _context.PortfolioSnapshots
                    .Where(s => s.HoldingId == holdingId
                             && s.SnapshotDate <= targetDate)
                    .OrderByDescending(s => s.SnapshotDate)
                    .FirstOrDefaultAsync();

                if (snapshot != null)
                    snapshots.Add(snapshot);
            }

            return snapshots.OrderBy(s => s.SchemeName);
        }

        public async Task<IEnumerable<PortfolioSnapshot>> GetAllLatestAsync()
        {
            // Get all active holding IDs
            var holdingIds = await _context.Holdings
                .Where(h => h.IsActive)
                .Select(h => h.Id)
                .ToListAsync();

            var snapshots = new List<PortfolioSnapshot>();

            foreach (var holdingId in holdingIds)
            {
                var snapshot = await _context.PortfolioSnapshots
                    .Where(s => s.HoldingId == holdingId)
                    .OrderByDescending(s => s.SnapshotDate)
                    .FirstOrDefaultAsync();

                if (snapshot != null)
                    snapshots.Add(snapshot);
            }

            return snapshots
                .OrderBy(s => s.InvestorName)
                .ThenBy(s => s.SchemeName);
        }

        // ── Helpers ───────────────────────────────────────────────
        public async Task<bool> SnapshotExistsAsync(
            int holdingId, DateTime date)
        {
            return await _context.PortfolioSnapshots
                .AnyAsync(s => s.HoldingId == holdingId
                            && s.SnapshotDate == date.Date);
        }
    }
}