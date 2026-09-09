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

        entity.Property(e => e.LapSplitsMs).HasColumnType("jsonb").IsRequired();

        entity.HasOne(g => g.Track)
              .WithMany(t => t.GhostSubmissions)
              .HasForeignKey(g => g.TrackId)
              .OnDelete(DeleteBehavior.Cascade);

        // Restrict, not Cascade: TimeTrialModerationService.DeleteProfileAsync already refuses to
        // delete a profile that still has submissions, but the count check and the delete are two
        // statements. A ghost uploaded in between was cascaded away silently, taking its blob with
        // it. The database now enforces what the service already intends, so that window closes.
        // The Track relationship above stays Cascade: nothing in the codebase deletes a track
        // (TrackSync soft-deletes via IsHidden), so there is no equivalent path to guard.
        entity.HasOne(g => g.TTProfile)
              .WithMany(p => p.GhostSubmissions)
              .HasForeignKey(g => g.TTProfileId)
              .OnDelete(DeleteBehavior.Restrict);
    }
}
