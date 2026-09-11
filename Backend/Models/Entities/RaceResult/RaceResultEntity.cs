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
    public long ProfileId { get; set; } // The RWFC profile id. Matches PlayerEntity.Pid, which is the same value stored as a string; there is no FK constraint between them.
    public int PlayerId { get; set; }  // 0 = main racer (the online player), 1 = local co-op guest on the same console. Only 0 is ever stored;
                                       // RaceResultService filters out 1 at collection time.
    public int FinishTime { get; set; }
    public short CharacterId { get; set; }
    public short VehicleId { get; set; }
    public short PlayerCount { get; set; }

    // Recomputed on ingest -- the position WFC reports is unreliable, so RaceResultService
    // ranks each sub-race by FinishTime instead. 0 means the player did not finish
    // (disconnect/DNF). Read by win-rate, position-distribution and average-position stats.
    public short FinishPos { get; set; }
    public int FramesIn1st { get; set; }
    public short CourseId { get; set; } // Maps to CourseId in TrackEntity
    public short EngineClassId { get; set; }

    // Room context stamped at collection time. Null for results collected before this field was added.
    public bool? IsPublic { get; set; }
    public string? Rk { get; set; } // Room kind/game mode. Null = standard racing.
}
