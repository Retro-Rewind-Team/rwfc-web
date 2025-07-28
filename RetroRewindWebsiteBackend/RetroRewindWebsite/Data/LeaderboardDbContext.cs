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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PlayerEntity>(entity =>
            {
                entity.HasIndex(e => e.Pid).IsUnique();
                entity.HasIndex(e => e.Fc);
                entity.HasIndex(e => e.Rank);
                entity.HasIndex(e => e.ActiveRank);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.IsSuspicious);
                entity.HasIndex(e => e.LastSeen);

                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Fc).HasMaxLength(20);
                entity.Property(e => e.Pid).HasMaxLength(50);
            });

            modelBuilder.Entity<VRHistoryEntity>(entity =>
            {
                entity.HasIndex(e => e.PlayerId);
                entity.HasIndex(e => e.Date);
                entity.HasIndex(e => new { e.PlayerId, e.Date });

                entity.Property(e => e.PlayerId).HasMaxLength(50);
                entity.Property(e => e.Fc).HasMaxLength(20);

                entity.HasOne(vh => vh.Player)
                      .WithMany(p => p.VRHistory)
                      .HasForeignKey(vh => vh.PlayerId)
                      .HasPrincipalKey(p => p.Pid)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
