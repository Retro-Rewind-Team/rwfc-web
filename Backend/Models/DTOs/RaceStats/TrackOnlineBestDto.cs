namespace RetroRewindWebsite.Models.DTOs.RaceStats;

public record TrackOnlineBestDto(
    int Rank,
    string PlayerName,
    string Pid,
    string Fc,
    string FinishTimeDisplay,
    DateTime AchievedAt,
    string GameMode
);
