using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.TimeTrial;

[Table("Tracks")]
public class TrackEntity
{
    [Key]
    public int Id { get; set; }

    public required string Name { get; set; }
    public required string TrackSlot { get; set; }
    public short SlotId { get; set; }
    public short CourseId { get; set; }
    public required string Category { get; set; }
    public short Laps { get; set; }
    public bool SupportsGlitch { get; set; } = false;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<GhostSubmissionEntity> GhostSubmissions { get; set; } = [];
}
