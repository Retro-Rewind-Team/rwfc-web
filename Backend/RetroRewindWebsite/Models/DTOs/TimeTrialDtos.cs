using System.ComponentModel.DataAnnotations;

namespace RetroRewindWebsite.Models.DTOs
{
    // ===== TRACK DTOs =====

    public class TrackDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string TrackSlot { get; set; }
        public short CourseId { get; set; }
        public required string Category { get; set; }
        public short Laps { get; set; }
        public bool SupportsGlitch { get; set; }
    }

    // ===== TT PROFILE DTOs =====

    public class TTProfileDto
    {
        public int Id { get; set; }
        public required string DisplayName { get; set; }
        public int TotalSubmissions { get; set; }
        public int CurrentWorldRecords { get; set; }
        public int CountryCode { get; set; }
        public string? CountryAlpha2 { get; set; }
        public string? CountryName { get; set; }
    }

    public class CreateTTProfileRequest
    {
        [Required(ErrorMessage = "Display name is required")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Display name must be between 2 and 50 characters")]
        public required string DisplayName { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Country code must be a positive number")]
        public int? CountryCode { get; set; }
    }

    public class UpdateTTProfileRequest
    {
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Display name must be between 2 and 50 characters")]
        public string? DisplayName { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Country code must be a positive number")]
        public int? CountryCode { get; set; }
    }

    public class ProfileCreationResultDto
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public TTProfileDto? Profile { get; set; }
    }

    public class ProfileUpdateResultDto
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public TTProfileDto? Profile { get; set; }
    }

    public class ProfileDeletionResultDto
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
    }

    public class ProfileListResultDto
    {
        public bool Success { get; set; }
        public int Count { get; set; }
        public List<TTProfileDto> Profiles { get; set; } = [];
    }

    // ===== GHOST SUBMISSION DTOs =====

    public class GhostSubmissionDto
    {
        public int Id { get; set; }
        public int TrackId { get; set; }
        public required string TrackName { get; set; }
        public int TTProfileId { get; set; }
        public required string PlayerName { get; set; }
        public int CountryCode { get; set; }
        public string? CountryAlpha2 { get; set; }
        public string? CountryName { get; set; }
        public short CC { get; set; }
        public int FinishTimeMs { get; set; }
        public required string FinishTimeDisplay { get; set; }
        public short VehicleId { get; set; }
        public short CharacterId { get; set; }
        public short ControllerType { get; set; }
        public short DriftType { get; set; }
        public bool Shroomless { get; set; } = false;
        public bool Glitch { get; set; } = false;
        public short DriftCategory { get; set; } 
        public required string MiiName { get; set; }
        public short LapCount { get; set; }
        public List<int> LapSplitsMs { get; set; } = [];
        public List<string> LapSplitsDisplay { get; set; } = [];
        public int FastestLapMs { get; set; }
        public string FastestLapDisplay { get; set; } = "";
        public required string GhostFilePath { get; set; }
        public DateOnly DateSet { get; set; }
        public DateTime SubmittedAt { get; set; }
    }

    public class GhostSubmissionDetailDto : GhostSubmissionDto
    {
        // Extended properties with human-readable names
        public string? VehicleName { get; set; }
        public string? CharacterName { get; set; }
        public string? ControllerName { get; set; }
        public string? DriftTypeName { get; set; }
        public string? DriftCategoryName { get; set; }
        public string? TrackSlotName { get; set; }
    }

    public class GhostSubmissionRequest
    {
        public required IFormFile GhostFile { get; set; }
        public int TrackId { get; set; }
        public int Cc { get; set; }
        public int TtProfileId { get; set; }
        public short DriftCategory { get; set; }
        public bool Shroomless { get; set; }
        public bool Glitch { get; set; }
    }

    public class GhostSubmissionResultDto
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public GhostSubmissionDetailDto? Submission { get; set; }
    }

    public class GhostSubmissionSearchResultDto
    {
        public bool Success { get; set; }
        public int Count { get; set; }
        public List<GhostSubmissionDetailDto> Submissions { get; set; } = [];
    }

    public class GhostDeletionResultDto
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
    }

    // ===== LEADERBOARD DTOs =====

    public class TrackLeaderboardDto
    {
        public required TrackDto Track { get; set; }
        public short CC { get; set; }
        public bool Glitch { get; set; }
        public List<GhostSubmissionDto> Submissions { get; set; } = [];
        public int TotalSubmissions { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int? FastestLapMs { get; set; }
        public string? FastestLapDisplay { get; set; }
    }

    public class TrackWorldRecordsDto
    {
        public int TrackId { get; set; }
        public required string TrackName { get; set; }
        public GhostSubmissionDto? WorldRecord150 { get; set; }
        public GhostSubmissionDto? WorldRecord200 { get; set; }
        public GhostSubmissionDto? WorldRecord150Glitch { get; set; }
        public GhostSubmissionDto? WorldRecord200Glitch { get; set; }
    }

    // ===== PLAYER STATS DTOs =====

    public class TTPlayerStats
    {
        public required TTProfileDto Profile { get; set; }
        public int TotalTracks { get; set; }
        public int Tracks150cc { get; set; }
        public int Tracks200cc { get; set; }
        public double AverageFinishPosition { get; set; }
        public int Top10Count { get; set; }
        public List<GhostSubmissionDto> RecentSubmissions { get; set; } = [];
    }

    // ===== UTILITY DTOs =====

    public class CountryDto
    {
        public int NumericCode { get; set; }
        public required string Alpha2 { get; set; }
        public required string Name { get; set; }
    }

    public class CountryListResultDto
    {
        public bool Success { get; set; }
        public int Count { get; set; }
        public List<CountryDto> Countries { get; set; } = [];
    }
}