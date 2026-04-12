namespace RetroRewindWebsite.Models.DTOs.Player;

public record SwapResultDto(
    bool Success,
    string Message,
    PlayerDto? SourcePlayerAfter = null,
    PlayerDto? TargetPlayerAfter = null
);
