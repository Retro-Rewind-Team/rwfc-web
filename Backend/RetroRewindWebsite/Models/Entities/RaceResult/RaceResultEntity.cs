using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetroRewindWebsite.Models.Entities.RaceResult;

[Table("RaceResults")]
public class RaceResultEntity
{
    [Key]
    public int Id { get; set; }

    public required string RoomId { get; set; }
    public int RaceNumber { get; set; }
    public DateTime RaceTimestamp { get; set; }

    public long ProfileId { get; set; } // Foreign key to PlayerProfileEntity.ProfileId
    public int PlayerId { get; set; }

    public int FinishTime { get; set; }
    public short CharacterId { get; set; }
    public short VehicleId { get; set; }
    public short PlayerCount { get; set; }
    public short FinishPos { get; set; }
    public int FramesIn1st { get; set; }
    public short CourseId { get; set; } // Maps to CourseId in TrackEntity
    public short EngineClassId { get; set; }
}
