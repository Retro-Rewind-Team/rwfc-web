using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Data.Configurations;

public class GhostSubmissionEntityConfiguration : IEntityTypeConfiguration<GhostSubmissionEntity>
{
    public void Configure(EntityTypeBuilder<GhostSubmissionEntity> entity)
    {
        entity.HasIndex(e => e.TrackId);
        entity.HasIndex(e => e.TTProfileId);
        entity.HasIndex(e => e.SubmittedAt);

        entity.HasIndex(e => new { e.TrackId, e.CC });
        entity.HasIndex(e => new { e.TrackId, e.CC, e.FinishTimeMs });
        entity.HasIndex(e => new { e.TrackId, e.CC, e.Glitch });

        entity.HasIndex(e => new { e.TrackId, e.CC, e.Glitch, e.FinishTimeMs, e.SubmittedAt });

        entity.HasIndex(e => new { e.TrackId, e.CC, e.DateSet });

        entity.Property(e => e.FinishTimeDisplay).HasMaxLength(20).IsRequired();
        entity.Property(e => e.MiiName).HasMaxLength(10).IsRequired();
        entity.Property(e => e.GhostFilePath).HasMaxLength(255).IsRequired();

        entity.Property(e => e.LapSplitsMs).HasColumnType("jsonb").IsRequired();

        entity.HasOne(g => g.Track)
              .WithMany(t => t.GhostSubmissions)
              .HasForeignKey(g => g.TrackId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(g => g.TTProfile)
              .WithMany(p => p.GhostSubmissions)
              .HasForeignKey(g => g.TTProfileId)
              .OnDelete(DeleteBehavior.Cascade);
    }
}
