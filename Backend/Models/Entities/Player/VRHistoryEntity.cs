using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.Player;

[Table("VRHistories")]
public class VRHistoryEntity
{
    [Key]
    public int Id { get; set; }

    public required string PlayerId { get; set; } // Foreign key to PlayerEntity.Pid
    public required string Fc { get; set; } // Same friend code as PlayerEntity.Fc, denormalised for easier querying
    public DateTime Date { get; set; }
    public int VRChange { get; set; }
    public int TotalVR { get; set; }

    public virtual PlayerEntity? Player { get; set; }
}
