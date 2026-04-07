namespace RetroRewindWebsite.Models.DTOs.Player;

public record InGamePlayerDto(
    string Name,
    string FriendCode,
    int VR,
    int Rank,
    string? MiiData
);
