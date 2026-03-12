using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.Player;

[Table("Players")]
public class PlayerEntity
{
    [Key]
    public int Id { get; set; }

    public required string Pid { get; set; }
    public required string Name { get; set; }
    public required string Fc { get; set; }
    public int Ev { get; set; }
    public required string MiiData { get; set; }

    // TODO: Extract to separate PlayerMiiCache table
    public string? MiiImageBase64 { get; set; }
    public DateTime? MiiImageFetchedAt { get; set; }

    public DateTime LastSeen { get; set; }
    public int Rank { get; set; }

    // TODO: Consider computing these via queries instead of storing
    public int VRGainLast24Hours { get; set; }
    public int VRGainLastWeek { get; set; }
    public int VRGainLastMonth { get; set; }

    public DateTime LastUpdated { get; set; }

    // TODO: Extract to separate PlayerModerationEntity table
    public bool IsSuspicious { get; set; }
    public int SuspiciousVRJumps { get; set; }
    public string FlagReason { get; set; } = string.Empty;
    public string UnflagReason { get; set; } = string.Empty;

    public virtual ICollection<VRHistoryEntity> VRHistory { get; set; } = [];
}
