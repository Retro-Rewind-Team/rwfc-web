using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Models.Entities;

namespace RetroRewindWebsite.Data
{
    public class LeaderboardDbContext : DbContext
    {
        public LeaderboardDbContext(DbContextOptions<LeaderboardDbContext> options) : base(options)
        {
        }

        // ===== DB SETS =====

        public DbSet<PlayerEntity> Players { get; set; }
        public DbSet<VRHistoryEntity> VRHistories { get; set; }
        public DbSet<LegacyPlayerEntity> LegacyPlayers { get; set; }
        public DbSet<TrackEntity> Tracks { get; set; }
        public DbSet<TTProfileEntity> TTProfiles { get; set; }
        public DbSet<GhostSubmissionEntity> GhostSubmissions { get; set; }

        // ===== MODEL CONFIGURATION =====

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigurePlayerEntity(modelBuilder);
            ConfigureLegacyPlayerEntity(modelBuilder);
            ConfigureVRHistoryEntity(modelBuilder);
            ConfigureTrackEntity(modelBuilder);
            ConfigureTTProfileEntity(modelBuilder);
            ConfigureGhostSubmissionEntity(modelBuilder);
        }

        // ===== PLAYER CONFIGURATION =====

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

        // ===== LEGACY PLAYER CONFIGURATION =====

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

        // ===== VR HISTORY CONFIGURATION =====

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

        // ===== TRACK CONFIGURATION =====

        private static void ConfigureTrackEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TrackEntity>(entity =>
            {
                // Indexes
                entity.HasIndex(e => e.CourseId);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.TrackSlot);

                // String length constraints
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.TrackSlot).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Category).HasMaxLength(10).IsRequired();
            });
        }

        // ===== TT PROFILE CONFIGURATION =====

        private static void ConfigureTTProfileEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TTProfileEntity>(entity =>
            {
                // Indexes
                entity.HasIndex(e => e.DisplayName).IsUnique();

                // String length constraints
                entity.Property(e => e.DisplayName).HasMaxLength(50).IsRequired();
            });
        }

        // ===== GHOST SUBMISSION CONFIGURATION =====

        private static void ConfigureGhostSubmissionEntity(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<GhostSubmissionEntity>(entity =>
            {
                // Single column indexes
                entity.HasIndex(e => e.TrackId);
                entity.HasIndex(e => e.TTProfileId);
                entity.HasIndex(e => e.SubmittedAt);

                // Composite indexes for common queries
                entity.HasIndex(e => new { e.TrackId, e.CC });
                entity.HasIndex(e => new { e.TrackId, e.CC, e.FinishTimeMs });

                // Performance indexes for leaderboard queries
                entity.HasIndex(e => new { e.TrackId, e.CC, e.FinishTimeMs, e.SubmittedAt });

                // Performance indexes for world record history
                entity.HasIndex(e => new { e.TrackId, e.CC, e.DateSet });

                // String length constraints
                entity.Property(e => e.FinishTimeDisplay).HasMaxLength(20).IsRequired();
                entity.Property(e => e.MiiName).HasMaxLength(10).IsRequired();
                entity.Property(e => e.GhostFilePath).HasMaxLength(255).IsRequired();

                // JSON column
                entity.Property(e => e.LapSplitsMs).HasColumnType("jsonb").IsRequired();

                // Relationships
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