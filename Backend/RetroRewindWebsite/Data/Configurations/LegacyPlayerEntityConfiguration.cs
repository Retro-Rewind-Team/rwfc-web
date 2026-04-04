using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Data.Configurations;

public class LegacyPlayerEntityConfiguration : IEntityTypeConfiguration<LegacyPlayerEntity>
{
    public void Configure(EntityTypeBuilder<LegacyPlayerEntity> entity)
    {
        entity.HasIndex(e => e.Pid);
        entity.HasIndex(e => e.Fc);
        entity.HasIndex(e => e.Rank);
        entity.HasIndex(e => e.IsSuspicious);

        entity.Property(e => e.Name).HasMaxLength(100);
        entity.Property(e => e.Fc).HasMaxLength(20);
        entity.Property(e => e.Pid).HasMaxLength(50);
    }
}
