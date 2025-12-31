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

        public DbSet<TrackEntity> Tracks { get; set; }
        public DbSet<TTProfileEntity> TTProfiles { get; set; }
        public DbSet<GhostSubmissionEntity> GhostSubmissions { get; set; }

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

                entity.Property(e => e.PlayerId).HasMaxLength(50);
                entity.Property(e => e.Fc).HasMaxLength(20);

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

            modelBuilder.Entity<TrackEntity>(entity =>
            {
                entity.HasIndex(e => e.CourseId);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.TrackSlot);

                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.TrackSlot).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Category).HasMaxLength(10).IsRequired();
            });

            modelBuilder.Entity<TTProfileEntity>(entity =>
            {
                entity.HasIndex(e => e.DiscordUserId).IsUnique();

                entity.Property(e => e.DiscordUserId).HasMaxLength(50).IsRequired();
                entity.Property(e => e.DisplayName).HasMaxLength(50).IsRequired();
            });

            modelBuilder.Entity<GhostSubmissionEntity>(entity =>
            {
                entity.HasIndex(e => e.TrackId);
                entity.HasIndex(e => e.TTProfileId);
                entity.HasIndex(e => new { e.TrackId, e.CC });
                entity.HasIndex(e => new { e.TrackId, e.CC, e.FinishTimeMs });
                entity.HasIndex(e => e.SubmittedAt);
                entity.HasIndex(e => e.SubmittedByDiscordId);

                entity.Property(e => e.FinishTimeDisplay).HasMaxLength(20).IsRequired();
                entity.Property(e => e.MiiName).HasMaxLength(10).IsRequired();
                entity.Property(e => e.GhostFilePath).HasMaxLength(255).IsRequired();
                entity.Property(e => e.SubmittedByDiscordId).HasMaxLength(50).IsRequired();
                entity.Property(e => e.LapSplitsMs).HasColumnType("jsonb").IsRequired();

                entity.HasOne(g => g.Track)
                      .WithMany(t => t.GhostSubmissions)
                      .HasForeignKey(g => g.TrackId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(g => g.TTProfile)
                      .WithMany(p => p.GhostSubmissions)
                      .HasForeignKey(g => g.TTProfileId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}