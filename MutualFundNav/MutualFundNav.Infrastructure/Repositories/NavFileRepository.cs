using Microsoft.EntityFrameworkCore;
using MutualFundNav.Domain.Entities;
using MutualFundNav.Domain.Interfaces;
using MutualFundNav.Infrastructure.Data;

namespace MutualFundNav.Infrastructure.Repositories
{
    public class NavFileRepository : INavFileRepository
    {
        private readonly ApplicationDbContext _context;

        public NavFileRepository(ApplicationDbContext context) => _context = context;

        public async Task<bool> ExistsByDateAsync(DateTime date) =>
            await _context.NavFiles.AnyAsync(f => f.NavDate.Date == date.Date);

        public async Task AddAsync(NavFile navFile) =>
            await _context.NavFiles.AddAsync(navFile);

        public async Task<NavFile?> GetByDateAsync(DateTime date) =>
            await _context.NavFiles
                .FirstOrDefaultAsync(f => f.NavDate.Date == date.Date);

        public async Task<IEnumerable<DateTime>> GetAllDatesAsync() =>
            await _context.NavFiles
                .OrderByDescending(f => f.NavDate)
                .Select(f => f.NavDate)
                .ToListAsync();

        public async Task<DateTime?> GetLatestDateAsync() =>
            await _context.NavFiles
                .MaxAsync(f => (DateTime?)f.NavDate);
    }
}
