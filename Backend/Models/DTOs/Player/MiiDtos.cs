namespace RetroRewindWebsite.Models.DTOs.Player;

public record MiiDto(string Data, string Name);

public record MiiResponseDto(string FriendCode, string MiiImageBase64);

public record BatchMiiRequestDto(List<string> FriendCodes);

public record BatchMiiResponseDto(Dictionary<string, string> Miis);
