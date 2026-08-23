using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.Multiplier;

[Table("Multipliers")]
public class MultiplierEntity
{
    [Key]
    public int Id { get; set; }

    public MultiplierChannel Channel { get; set; }

    public double Value { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public DateTime CreatedAt { get; set; }
}
