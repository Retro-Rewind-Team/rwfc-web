namespace RetroRewindWebsite.Models.DTOs.Player;

public record PlayerBasicDto(
    string Pid,
    string Name,
    string FriendCode,
    bool IsSuspicious,
    int SuspiciousVRJumps,
    string? FlagReason,
    string? UnflagReason
);
