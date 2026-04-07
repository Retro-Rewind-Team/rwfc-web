namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record GhostSubmissionDto
{
    public required int Id { get; init; }
    public required int TrackId { get; init; }
    public required string TrackName { get; init; }
    public required int TTProfileId { get; init; }
    public required string PlayerName { get; init; }
    public required int CountryCode { get; init; }
    public string? CountryAlpha2 { get; init; }
    public string? CountryName { get; init; }
    public required short CC { get; init; }
    public required int FinishTimeMs { get; init; }
    public required string FinishTimeDisplay { get; init; }
    public required short VehicleId { get; init; }
    public required short CharacterId { get; init; }
    public required short ControllerType { get; init; }
    public required short DriftType { get; init; }
    public required bool Shroomless { get; init; }
    public required bool Glitch { get; init; }
    public required bool IsFlap { get; init; }
    public required short DriftCategory { get; init; }
    public required string MiiName { get; init; }
    public required short LapCount { get; init; }
    public required List<int> LapSplitsMs { get; init; }
    public required List<string> LapSplitsDisplay { get; init; }
    public required int FastestLapMs { get; init; }
    public required string FastestLapDisplay { get; init; }
    public required string GhostFilePath { get; init; }
    public required DateOnly DateSet { get; init; }
    public required DateTime SubmittedAt { get; init; }
    public int? Rank { get; init; }
}

public record GhostSubmissionDetailDto : GhostSubmissionDto
{
    public string? VehicleName { get; init; }
    public string? CharacterName { get; init; }
    public string? ControllerName { get; init; }
    public string? DriftTypeName { get; init; }
    public string? DriftCategoryName { get; init; }
}

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
