using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Data
{
    public class LeaderboardDbContext : DbContext
    {
        public LeaderboardDbContext(DbContextOptions<LeaderboardDbContext> options) : base(options)
        {
        }

        public DbSet<PlayerEntity> Players { get; set; }
        public DbSet<VRHistoryEntity> VRHistories { get; set; }
        public DbSet<LegacyPlayerEntity> LegacyPlayers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigurePlayerEntity(modelBuilder);
            ConfigureLegacyPlayerEntity(modelBuilder);
            ConfigureVRHistoryEntity(modelBuilder);
        }

        private static void ConfigurePlayerEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PlayerEntity>(entity =>
            {
                // Primary indexes
                entity.HasIndex(e => e.Pid).IsUnique();
                entity.HasIndex(e => e.Fc);
                entity.HasIndex(e => e.Rank);
                entity.HasIndex(e => e.IsSuspicious);
                entity.HasIndex(e => e.LastSeen);

                // Composite indexes for common queries
                entity.HasIndex(e => new { e.IsSuspicious, e.Ev, e.LastSeen });
                entity.HasIndex(e => new { e.MiiImageFetchedAt, e.MiiData })
                    .HasFilter("\"MiiData\" IS NOT NULL AND \"MiiData\" != ''");

                // VR gain indexes
                entity.HasIndex(e => e.VRGainLast24Hours);
                entity.HasIndex(e => e.VRGainLastWeek);
                entity.HasIndex(e => e.VRGainLastMonth);

                // String length constraints
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Fc).HasMaxLength(20);
                entity.Property(e => e.Pid).HasMaxLength(50);
            });
        }

        private static void ConfigureLegacyPlayerEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<LegacyPlayerEntity>(entity =>
            {
                // Indexes
                entity.HasIndex(e => e.Pid);
                entity.HasIndex(e => e.Fc);
                entity.HasIndex(e => e.Rank);
                entity.HasIndex(e => e.IsSuspicious);

                // String length constraints
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Fc).HasMaxLength(20);
                entity.Property(e => e.Pid).HasMaxLength(50);
            });
        }

        private static void ConfigureVRHistoryEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<VRHistoryEntity>(entity =>
            {
                // Indexes for common queries
                entity.HasIndex(e => e.PlayerId);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => new { e.PlayerId, e.Date });

                // String length constraints
                entity.Property(e => e.PlayerId).HasMaxLength(50);
                entity.Property(e => e.Fc).HasMaxLength(20);

                // Relationship configuration
                entity.HasOne(vh => vh.Player)
                      .WithMany(p => p.VRHistory)
                      .HasForeignKey(vh => vh.PlayerId)
                      .HasPrincipalKey(p => p.Pid)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}