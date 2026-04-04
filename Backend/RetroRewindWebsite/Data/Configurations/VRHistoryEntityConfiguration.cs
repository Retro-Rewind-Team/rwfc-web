using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Data.Configurations;

public class VRHistoryEntityConfiguration : IEntityTypeConfiguration<VRHistoryEntity>
{
    public void Configure(EntityTypeBuilder<VRHistoryEntity> entity)
    {
        entity.HasIndex(e => e.PlayerId);
        entity.HasIndex(e => e.Date);
        entity.HasIndex(e => new { e.PlayerId, e.Date });

        entity.Property(e => e.PlayerId).HasMaxLength(50);
        entity.Property(e => e.Fc).HasMaxLength(20);

        entity.HasOne(vh => vh.Player)
              .WithMany(p => p.VRHistory)
              .HasForeignKey(vh => vh.PlayerId)
              .HasPrincipalKey(p => p.Pid)
              .OnDelete(DeleteBehavior.SetNull);
    }
}
