using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.TimeTrial;

[Table("Tracks")]
public class TrackEntity
{
    [Key]
    public int Id { get; set; }

    public required string Name { get; set; }
    public short CourseId { get; set; }
    public required string Category { get; set; } // Retro or Custom, used for filtering/grouping
    public short Laps { get; set; }
    public bool SupportsGlitch { get; set; } = false; // Whether the track supports glitch runs, used for filtering
    public int SortOrder { get; set; } // Used for sorting tracks in the UI, lower values appear first
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<GhostSubmissionEntity> GhostSubmissions { get; set; } = [];
}
