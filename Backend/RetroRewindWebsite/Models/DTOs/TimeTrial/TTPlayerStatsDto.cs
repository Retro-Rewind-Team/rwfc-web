namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record TTPlayerStatsDto(
    TTProfileDto Profile,
    int TotalTracks,
    int Tracks150cc,
    int Tracks200cc,
    double AverageFinishPosition,
    int Top10Count
);
