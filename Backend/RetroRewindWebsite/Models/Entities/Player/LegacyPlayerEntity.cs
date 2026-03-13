using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.Player;

[Table("LegacyPlayers")]
public class LegacyPlayerEntity
{
    [Key]
    public int Id { get; set; }

    public required string Pid { get; set; }
    public required string Name { get; set; }
    public required string Fc { get; set; }
    public int Ev { get; set; }
    public int Rank { get; set; }
    public bool IsSuspicious { get; set; }
    public required string MiiData { get; set; }

    // TODO: Extract to separate cache table, same as PlayerEntity
    public string? MiiImageBase64 { get; set; }

    public DateTime SnapshotDate { get; set; }
}
