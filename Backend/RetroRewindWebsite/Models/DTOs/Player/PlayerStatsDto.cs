namespace RetroRewindWebsite.Models.DTOs.Player;

public record PlayerStatsDto(
    string Pid,
    string Name,
    string FriendCode,
    int VR,
    int Rank,
    DateTime LastSeen,
    bool IsSuspicious,
    int SuspiciousVRJumps,
    VRStatsDto VRStats
);
