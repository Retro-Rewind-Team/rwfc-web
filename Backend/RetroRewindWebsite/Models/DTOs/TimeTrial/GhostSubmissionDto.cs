namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record GhostSubmissionDto(
    int Id,
    int TrackId,
    string TrackName,
    int TTProfileId,
    string PlayerName,
    int CountryCode,
    string? CountryAlpha2,
    string? CountryName,
    short CC,
    int FinishTimeMs,
    string FinishTimeDisplay,
    short VehicleId,
    short CharacterId,
    short ControllerType,
    short DriftType,
    bool Shroomless,
    bool Glitch,
    short DriftCategory,
    string MiiName,
    short LapCount,
    List<int> LapSplitsMs,
    List<string> LapSplitsDisplay,
    int FastestLapMs,
    string FastestLapDisplay,
    string GhostFilePath,
    DateOnly DateSet,
    DateTime SubmittedAt
);

public record GhostSubmissionDetailDto(
    int Id,
    int TrackId,
    string TrackName,
    int TTProfileId,
    string PlayerName,
    int CountryCode,
    string? CountryAlpha2,
    string? CountryName,
    short CC,
    int FinishTimeMs,
    string FinishTimeDisplay,
    short VehicleId,
    short CharacterId,
    short ControllerType,
    short DriftType,
    bool Shroomless,
    bool Glitch,
    short DriftCategory,
    string MiiName,
    short LapCount,
    List<int> LapSplitsMs,
    List<string> LapSplitsDisplay,
    int FastestLapMs,
    string FastestLapDisplay,
    string GhostFilePath,
    DateOnly DateSet,
    DateTime SubmittedAt,
    string? VehicleName,
    string? CharacterName,
    string? ControllerName,
    string? DriftTypeName,
    string? DriftCategoryName,
    string? TrackSlotName
) : GhostSubmissionDto(
    Id, TrackId, TrackName, TTProfileId, PlayerName, CountryCode, CountryAlpha2, CountryName,
    CC, FinishTimeMs, FinishTimeDisplay, VehicleId, CharacterId, ControllerType,
    DriftType, Shroomless, Glitch, DriftCategory, MiiName, LapCount, LapSplitsMs,
    LapSplitsDisplay, FastestLapMs, FastestLapDisplay, GhostFilePath, DateSet, SubmittedAt
);

public class GhostSubmissionRequest
{
    public required IFormFile GhostFile { get; set; }
    public int TrackId { get; set; }
    public int Cc { get; set; }
    public int TtProfileId { get; set; }
    public bool Shroomless { get; set; }
    public bool Glitch { get; set; }
}
