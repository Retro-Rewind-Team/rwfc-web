using Microsoft.EntityFrameworkCore;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.Entities.RaceResult;
using RetroRewindWebsite.Models.Entities.Room;
using RetroRewindWebsite.Models.Entities.TimeTrial;
using System.Reflection;

namespace RetroRewindWebsite.Data;

public class LeaderboardDbContext : DbContext
{
    public LeaderboardDbContext(DbContextOptions<LeaderboardDbContext> options) : base(options)
    {
    }

    // ===== DB SETS =====

    public DbSet<PlayerEntity> Players { get; set; }
    public DbSet<PlayerMiiCacheEntity> PlayerMiiCaches { get; set; }
    public DbSet<VRHistoryEntity> VRHistories { get; set; }
    public DbSet<LegacyPlayerEntity> LegacyPlayers { get; set; }
    public DbSet<TrackEntity> Tracks { get; set; }
    public DbSet<TTProfileEntity> TTProfiles { get; set; }
    public DbSet<GhostSubmissionEntity> GhostSubmissions { get; set; }
    public DbSet<RaceResultEntity> RaceResults { get; set; }
    public DbSet<RoomSnapshotEntity> RoomSnapshots { get; set; }
    // ===== MODEL CONFIGURATION =====

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

}
