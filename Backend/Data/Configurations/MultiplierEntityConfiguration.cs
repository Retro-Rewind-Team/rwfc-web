using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RetroRewindWebsite.Models.Entities.Multiplier;

namespace RetroRewindWebsite.Data.Configurations;

public class MultiplierEntityConfiguration : IEntityTypeConfiguration<MultiplierEntity>
{
    public void Configure(EntityTypeBuilder<MultiplierEntity> entity)
    {
        entity.HasIndex(e => new { e.Channel, e.StartTime, e.EndTime });
    }
}
