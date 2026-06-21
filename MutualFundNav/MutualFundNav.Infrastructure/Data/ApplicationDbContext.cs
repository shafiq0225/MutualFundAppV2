using Microsoft.EntityFrameworkCore;
using MutualFundNav.Domain.Entities;

namespace MutualFundNav.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<NavFile>         NavFiles        { get; set; }
        public DbSet<MarketHoliday>   MarketHolidays  { get; set; }
        public DbSet<JobExecutionLog> JobExecutionLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── NavFile ────────────────────────────────────────────────────
            modelBuilder.Entity<NavFile>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.NavDate).IsUnique();
                e.Property(x => x.NavDate).IsRequired();
                e.Property(x => x.FileContent).HasColumnType("nvarchar(max)").IsRequired();
                e.Property(x => x.Checksum).HasMaxLength(64).IsRequired();
                e.Property(x => x.FileSizeBytes).IsRequired();
                e.Property(x => x.RecordCount).IsRequired();
                e.Property(x => x.DownloadedAt).IsRequired();
                e.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // ── MarketHoliday ──────────────────────────────────────────────
            modelBuilder.Entity<MarketHoliday>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.HolidayDate).IsUnique();
                e.Property(x => x.HolidayDate).IsRequired();
                e.Property(x => x.Description).HasMaxLength(256);
                e.Property(x => x.Source).HasMaxLength(64);
                e.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // ── JobExecutionLog ────────────────────────────────────────────
            modelBuilder.Entity<JobExecutionLog>(e =>
            {
                e.HasKey(x => x.Id);
                e.HasIndex(x => x.StartedAt);
                e.Property(x => x.JobName).HasMaxLength(128).IsRequired();
                e.Property(x => x.ErrorMessage).HasMaxLength(2048);
                e.Property(x => x.Details).HasMaxLength(4096);
                e.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });
        }
    }
}
