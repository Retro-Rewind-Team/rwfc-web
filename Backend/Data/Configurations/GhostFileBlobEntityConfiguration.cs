using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Data.Configurations;

public class GhostFileBlobEntityConfiguration : IEntityTypeConfiguration<GhostFileBlobEntity>
{
    public void Configure(EntityTypeBuilder<GhostFileBlobEntity> entity)
    {
        entity.Property(e => e.Data).HasColumnType("bytea").IsRequired();

        entity.HasOne(b => b.GhostSubmission)
              .WithOne(g => g.GhostFile)
              .HasForeignKey<GhostFileBlobEntity>(b => b.Id)
              .OnDelete(DeleteBehavior.Cascade);
    }
}
