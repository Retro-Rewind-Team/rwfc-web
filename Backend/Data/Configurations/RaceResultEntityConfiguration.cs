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

        entity.HasIndex(e => e.ProfileId);
        entity.HasIndex(e => e.CourseId);
        entity.HasIndex(e => e.RaceTimestamp);
        entity.HasIndex(e => e.CharacterId);
        entity.HasIndex(e => e.VehicleId);

        entity.HasIndex(e => new { e.CourseId, e.EngineClassId });
        entity.HasIndex(e => new { e.CourseId, e.FinishTime });
        entity.HasIndex(e => new { e.ProfileId, e.CourseId });
        entity.HasIndex(e => new { e.ProfileId, e.CharacterId });
        entity.HasIndex(e => new { e.ProfileId, e.VehicleId });
        entity.HasIndex(e => new { e.ProfileId, e.RaceTimestamp });

        entity.HasIndex(e => e.IsPublic);
        entity.HasIndex(e => e.Rk);

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
