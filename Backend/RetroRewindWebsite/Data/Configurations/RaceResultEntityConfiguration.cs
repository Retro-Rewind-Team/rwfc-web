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

        entity.Property(e => e.RoomId).HasMaxLength(10).IsRequired();
    }
}
