using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Data.Configurations;

public class TrackEntityConfiguration : IEntityTypeConfiguration<TrackEntity>
{
    public void Configure(EntityTypeBuilder<TrackEntity> entity)
    {
        entity.HasIndex(e => e.Category);
        entity.HasIndex(e => e.SupportsGlitch);

        entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
        entity.Property(e => e.Category).HasMaxLength(10).IsRequired();
        entity.Property(e => e.IsHidden).HasDefaultValue(false).IsRequired();
    }
}
