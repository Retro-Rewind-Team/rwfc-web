using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.TimeTrial;

[Table("GhostSubmissions")]
public class GhostSubmissionEntity
{
    [Key]
    public int Id { get; set; }

    public int TrackId { get; set; }
    public int TTProfileId { get; set; }

    public short CC { get; set; }
    public int FinishTimeMs { get; set; }
    public required string FinishTimeDisplay { get; set; }

    public short VehicleId { get; set; }
    public short CharacterId { get; set; }
    public short ControllerType { get; set; }
    public short DriftType { get; set; }
    public required string MiiName { get; set; }

    public short LapCount { get; set; }
    public List<int> LapSplitsMs { get; set; } = [];

    public bool Shroomless { get; set; } = false;
    public bool Glitch { get; set; } = false;
    public short DriftCategory { get; set; }

    public required string GhostFilePath { get; set; }
    public DateOnly DateSet { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public virtual TrackEntity? Track { get; set; }
    public virtual TTProfileEntity? TTProfile { get; set; }
}
