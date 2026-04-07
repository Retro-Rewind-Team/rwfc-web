using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Data.Configurations;

public class TTProfileEntityConfiguration : IEntityTypeConfiguration<TTProfileEntity>
{
    public void Configure(EntityTypeBuilder<TTProfileEntity> entity)
    {
        entity.HasIndex(e => e.DisplayName).IsUnique();

        entity.Property(e => e.DisplayName).HasMaxLength(50).IsRequired();
    }
}
