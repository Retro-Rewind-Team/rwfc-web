namespace RetroRewindWebsite.Models.Domain;

/// <summary>
/// Identifies a single race uniquely (one room session can contain many races).
/// PlayerCount is part of the identity because a split room (WFC connectivity split)
/// shares the same RoomId and RaceNumber across its sub-races, but each sub-race
/// reports its own participant count.
/// </summary>
public record RaceKey(
    string RoomId,
    int RaceNumber,
    DateTime RaceTimestamp,
    short CourseId,
    short EngineClassId,
    short PlayerCount
);
