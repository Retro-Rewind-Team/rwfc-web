using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Data.Configurations;

public class VRHistoryEntityConfiguration : IEntityTypeConfiguration<VRHistoryEntity>
{
    public void Configure(EntityTypeBuilder<VRHistoryEntity> entity)
    {
        // No standalone PlayerId index: a btree on (PlayerId, Date) already serves lookups on
        // PlayerId alone, including the foreign key's own check, so the single-column one only
        // added write cost.
        entity.HasIndex(e => e.Date);
        entity.HasIndex(e => new { e.PlayerId, e.Date });

        entity.Property(e => e.PlayerId).HasMaxLength(50);
        entity.Property(e => e.Fc).HasMaxLength(20);

        // PlayerId is a required string, so the column is NOT NULL and SetNull could only ever
        // raise a not-null violation: the delete would fail rather than do what the configuration
        // claimed. Restrict states that outcome honestly. Cascade is the alternative and is
        // deliberately not used, because VR history is the record of how a player got their rating
        // and should outlive an accidental delete of the player row. Nothing deletes players today,
        // so this changes no current behaviour.
        entity.HasOne(vh => vh.Player)
              .WithMany(p => p.VRHistory)
              .HasForeignKey(vh => vh.PlayerId)
              .HasPrincipalKey(p => p.Pid)
              .OnDelete(DeleteBehavior.Restrict);
    }
}
