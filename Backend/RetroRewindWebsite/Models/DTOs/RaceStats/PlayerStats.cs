namespace RetroRewindWebsite.Models.DTOs.RaceStats;

public record PlayerStatsDto(
    string Pid,
    string Name,
    string Fc,
    int Vr,
    int Rank,
    DateTime LastSeen,
    bool IsSuspicious,
    int VrGain24h,
    int VrGain7d,
    int VrGain30d,

    PlayerRaceStatsDto? RaceStats
);
