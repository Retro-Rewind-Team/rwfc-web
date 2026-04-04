using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Data.Configurations;

public class PlayerMiiCacheEntityConfiguration : IEntityTypeConfiguration<PlayerMiiCacheEntity>
{
    public void Configure(EntityTypeBuilder<PlayerMiiCacheEntity> entity)
    {
        entity.HasOne(m => m.Player)
              .WithOne(p => p.MiiCache)
              .HasForeignKey<PlayerMiiCacheEntity>(m => m.PlayerId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(e => e.MiiImageFetchedAt);
    }
}
