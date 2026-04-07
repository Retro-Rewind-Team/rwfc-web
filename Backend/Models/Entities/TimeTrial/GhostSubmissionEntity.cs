using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.TimeTrial;

[Table("GhostSubmissions")]
public class GhostSubmissionEntity
{
    [Key]
    public int Id { get; set; }

    public int TrackId { get; set; } // Foreign key to TrackEntity.Id
    public int TTProfileId { get; set; } // Foreign key to TTProfileEntity.Id, the profile of the racer

    public short CC { get; set; } // 150 or 200
    public int FinishTimeMs { get; set; }
    public required string FinishTimeDisplay { get; set; } // Formatted time for display, e.g. "1:23.456"

    public short VehicleId { get; set; } // Vehicle used, stored as short for compactness, mapped to name via MarioKartMappings
    public short CharacterId { get; set; } // Character used, stored as short for compactness, mapped to name via MarioKartMappings
    public short ControllerType { get; set; } // Controller type used, stored as short for compactness, mapped to name via MarioKartMappings
    public short DriftType { get; set; } // Drift type used, stored as short for compactness, mapped to name via MarioKartMappings
    public required string MiiName { get; set; }

    public short LapCount { get; set; }
    public List<int> LapSplitsMs { get; set; } = []; // List of lap split times in milliseconds, length should match LapCount

    public bool Shroomless { get; set; } = false;
    public bool Glitch { get; set; } = false;
    public bool IsFlap { get; set; } = false;
    public short DriftCategory { get; set; } // Drift category used, stored as short for compactness, mapped to name via MarioKartMappings

    public required string GhostFilePath { get; set; }
    public DateOnly DateSet { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public virtual TrackEntity? Track { get; set; }
    public virtual TTProfileEntity? TTProfile { get; set; }
}
