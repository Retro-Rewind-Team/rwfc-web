namespace RetroRewindWebsite.Models.DTOs.RaceStats;

/// <summary>
/// One participant's result in a single race.
/// Name and FriendCode are null when the player has no PlayerEntity row.
/// </summary>
public record RaceEntryDto(
    long ProfileId,
    string? Name,
    string? FriendCode,
    short FinishPos,
    string FinishTimeDisplay,
    string CharacterName,
    string VehicleName,
    int FramesIn1st
);
