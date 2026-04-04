using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.Room;

namespace RetroRewindWebsite.Data.Configurations;

public class RoomSnapshotEntityConfiguration : IEntityTypeConfiguration<RoomSnapshotEntity>
{
    public void Configure(EntityTypeBuilder<RoomSnapshotEntity> entity)
    {
        entity.HasIndex(e => e.Timestamp);

        entity.Property(e => e.Rooms)
              .HasColumnType("jsonb")
              .IsRequired();
    }
}
