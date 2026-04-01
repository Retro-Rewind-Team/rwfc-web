using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.Player;

[Table("LegacyPlayers")]
public class LegacyPlayerEntity
{
    [Key]
    public int Id { get; set; }

    public required string Pid { get; set; } // Player ID, same as PlayerEntity.Pid, used for joining with PlayerEntity
    public required string Name { get; set; }
    public required string Fc { get; set; } // Friend code, stored string format as sent by WFC (e.g. "1234-5678-9012")
    public int Ev { get; set; }
    public int Rank { get; set; }
    public bool IsSuspicious { get; set; }
    public required string MiiData { get; set; }

    // TODO: Extract to separate cache table, same as PlayerEntity
    public string? MiiImageBase64 { get; set; }

    public DateTime SnapshotDate { get; set; }
}
