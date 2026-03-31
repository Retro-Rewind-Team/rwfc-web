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
    bool IsFlap,
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
    int? Rank = null
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
    bool IsFlap,
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
    int? Rank = null
) : GhostSubmissionDto(
    Id, TrackId, TrackName, TTProfileId, PlayerName, CountryCode, CountryAlpha2, CountryName,
    CC, FinishTimeMs, FinishTimeDisplay, VehicleId, CharacterId, ControllerType,
    DriftType, Shroomless, Glitch, IsFlap, DriftCategory, MiiName, LapCount, LapSplitsMs,
    LapSplitsDisplay, FastestLapMs, FastestLapDisplay, GhostFilePath, DateSet, SubmittedAt, Rank
);

public class GhostSubmissionRequest
{
    public required IFormFile GhostFile { get; set; }
    public int TrackId { get; set; }
    public int Cc { get; set; }
    public int TtProfileId { get; set; }
    public bool Shroomless { get; set; }
    public bool Glitch { get; set; }
    public bool IsFlap { get; set; }
}
