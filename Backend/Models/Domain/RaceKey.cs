namespace RetroRewindWebsite.Models.Domain;

/// <summary>
/// Identifies a single race uniquely (one room session can contain many races).
/// </summary>
public record RaceKey(
    string RoomId,
    int RaceNumber,
    DateTime RaceTimestamp,
    short CourseId,
    short EngineClassId
);
