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
    public required string Fc { get; set; } // Friend code, stored string format as sent by WFC (e.g. "1234-5678-9012")
    public int Ev { get; set; } // VR as sent by WFC, can be 0 if missing/invalid
    public required string MiiData { get; set; }

    public DateTime LastSeen { get; set; }
    public int Rank { get; set; }

    public int VRGainLast24Hours { get; set; }
    public int VRGainLastWeek { get; set; }
    public int VRGainLastMonth { get; set; }

    public DateTime LastUpdated { get; set; }

    public bool IsSuspicious { get; set; }
    public int SuspiciousVRJumps { get; set; }
    public string FlagReason { get; set; } = string.Empty;
    public string UnflagReason { get; set; } = string.Empty;

    public virtual PlayerMiiCacheEntity? MiiCache { get; set; }
    public virtual ICollection<VRHistoryEntity> VRHistory { get; set; } = [];
}
