namespace RetroRewindWebsite.Models.DTOs.RaceStats;

public record PlayerOnlineBestDto(
    string TrackName,
    short CourseId,
    short EngineClassId,
    string FinishTimeDisplay,
    DateTime AchievedAt,
    string GameMode
);
