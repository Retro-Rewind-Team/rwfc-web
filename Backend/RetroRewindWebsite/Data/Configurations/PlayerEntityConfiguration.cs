using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Data.Configurations;

public class PlayerEntityConfiguration : IEntityTypeConfiguration<PlayerEntity>
{
    public void Configure(EntityTypeBuilder<PlayerEntity> entity)
    {
        entity.HasIndex(e => e.Pid).IsUnique();
        entity.HasIndex(e => e.Fc);
        entity.HasIndex(e => e.Rank);
        entity.HasIndex(e => e.IsSuspicious);
        entity.HasIndex(e => e.LastSeen);

        entity.HasIndex(e => new { e.IsSuspicious, e.Ev, e.LastSeen });

        entity.HasIndex(e => e.VRGainLast24Hours);
        entity.HasIndex(e => e.VRGainLastWeek);
        entity.HasIndex(e => e.VRGainLastMonth);

        entity.Property(e => e.Name).HasMaxLength(100);
        entity.Property(e => e.Fc).HasMaxLength(20);
        entity.Property(e => e.Pid).HasMaxLength(50);
    }
}
