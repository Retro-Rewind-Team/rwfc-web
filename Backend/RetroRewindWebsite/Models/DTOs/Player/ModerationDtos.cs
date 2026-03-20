namespace RetroRewindWebsite.Models.DTOs.Player;

public record VRJumpDto(DateTime Date, int VRChange, int TotalVR);

public record SuspiciousJumpsResultDto(
    PlayerBasicDto Player,
    List<VRJumpDto> SuspiciousJumps,
    int Count
);

public record ModerationActionResultDto(bool Success, string Message, PlayerDto? Player = null);
