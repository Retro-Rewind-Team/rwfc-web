namespace RetroRewindWebsite.Models.DTOs
{
    // Request DTOs
    public class GhostSubmissionRequest
    {
        public required int TrackId { get; set; }
        public required short CC { get; set; } // 150 or 200
        public required IFormFile GhostFile { get; set; }
    }

    public class TimeTrialLeaderboardRequest
    {
        public int TrackId { get; set; }
        public short CC { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // Response DTOs
    public class TrackDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string TrackSlot { get; set; }
        public short CourseId { get; set; }
        public required string Category { get; set; }
        public short Laps { get; set; }
    }

    public class TTProfileDto
    {
        public int Id { get; set; }
        public required string DiscordUserId { get; set; }
        public required string DisplayName { get; set; }
        public int TotalSubmissions { get; set; }
        public int CurrentWorldRecords { get; set; }
    }

    public class GhostSubmissionDto
    {
        public int Id { get; set; }
        public int TrackId { get; set; }
        public required string TrackName { get; set; }
        public int TTProfileId { get; set; }
        public required string PlayerName { get; set; }
        public short CC { get; set; }
        public int FinishTimeMs { get; set; }
        public required string FinishTimeDisplay { get; set; }
        public short VehicleId { get; set; }
        public short CharacterId { get; set; }
        public short ControllerType { get; set; }
        public short DriftType { get; set; }
        public required string MiiName { get; set; }
        public short LapCount { get; set; }
        public List<int> LapSplitsMs { get; set; } = [];
        public required string GhostFilePath { get; set; }
        public DateOnly DateSet { get; set; }
        public DateTime SubmittedAt { get; set; }
    }

    public class TrackLeaderboardDto
    {
        public required TrackDto Track { get; set; }
        public short CC { get; set; }
        public List<GhostSubmissionDto> Submissions { get; set; } = [];
        public int TotalSubmissions { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
    }

    public class GhostSubmissionResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public GhostSubmissionDto? Submission { get; set; }
    }
}