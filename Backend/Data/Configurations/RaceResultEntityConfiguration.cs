using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Data.Configurations;

public class RaceResultEntityConfiguration : IEntityTypeConfiguration<RaceResultEntity>
{
    public void Configure(EntityTypeBuilder<RaceResultEntity> entity)
    {
        entity.HasIndex(e => new { e.RoomId, e.RaceNumber, e.ProfileId })
              .IsUnique()
              .HasDatabaseName("IX_RaceResults_RoomId_RaceNumber_ProfileId");

        // Index set trimmed against production idx_scan counts on 2026-09-11. Five indexes that
        // the planner had never once chosen were removed; the counts behind each decision are in
        // the migration that dropped them. CharacterId and VehicleId were only ever grouped by,
        // never filtered on, and IsPublic and Rk match almost every row.
        entity.HasIndex(e => e.ProfileId);
        entity.HasIndex(e => e.CourseId);
        entity.HasIndex(e => e.RaceTimestamp);

        entity.HasIndex(e => new { e.CourseId, e.EngineClassId });

        // Zero scans in production, but only because the Online Bests page it serves is currently
        // unrouted. Kept deliberately rather than dropped with the rest.
        entity.HasIndex(e => new { e.CourseId, e.FinishTime });

        entity.HasIndex(e => new { e.ProfileId, e.CourseId });

        // The busiest index on the table: UpdatePlayerVehiclePreferencesAsync groups race results
        // by vehicle per profile on every sync tick. There is no character equivalent, which is
        // why the matching CharacterId composite was dropped.
        entity.HasIndex(e => new { e.ProfileId, e.VehicleId });

        entity.HasIndex(e => new { e.ProfileId, e.RaceTimestamp });

        // Supports the distinct race count query (GetTotalRaceCountAsync).
        entity.HasIndex(e => new { e.RoomId, e.RaceNumber })
              .HasFilter("\"PlayerId\" = 0")
              .HasDatabaseName("IX_RaceResults_RoomId_RaceNumber_PlayerId0");

        // Supports GetAllPlayedTracksAsync which deduplicates on (CourseId, RoomId, RaceNumber)
        // and groups by CourseId — covering index enables an index-only scan.
        entity.HasIndex(e => new { e.CourseId, e.RoomId, e.RaceNumber })
              .HasFilter("\"PlayerId\" = 0")
              .HasDatabaseName("IX_RaceResults_CourseId_RoomId_RaceNumber_PlayerId0");

        entity.Property(e => e.RoomId).HasMaxLength(10).IsRequired();
    }
}
