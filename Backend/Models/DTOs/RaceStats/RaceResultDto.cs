namespace RetroRewindWebsite.Models.DTOs.RaceStats;

/// <summary>
/// All participants in a single race, plus race metadata.
/// </summary>
public record RaceResultDto(
    string RoomId,
    int RaceNumber,
    DateTime Timestamp,
    short CourseId,
    string TrackName,
    short EngineClassId,
    List<RaceEntryDto> Participants,
    string? GameMode,
    bool? IsPublic
);
