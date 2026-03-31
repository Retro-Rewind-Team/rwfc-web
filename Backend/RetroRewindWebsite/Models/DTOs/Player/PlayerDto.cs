namespace RetroRewindWebsite.Models.DTOs.Player;

public record PlayerDto(
    string Pid,
    string Name,
    string FriendCode,
    int VR,
    int Rank,
    DateTime LastSeen,
    bool IsSuspicious,
    VRStatsDto VRStats,
    string? MiiImageBase64,
    string? MiiData
);
