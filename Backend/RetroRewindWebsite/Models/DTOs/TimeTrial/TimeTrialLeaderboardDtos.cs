namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record TrackLeaderboardDto(
    TrackDto Track,
    short CC,
    bool Glitch,
    List<GhostSubmissionDto> Submissions,
    int TotalSubmissions,
    int CurrentPage,
    int PageSize,
    int? FastestLapMs,
    string? FastestLapDisplay
);

public record TrackWorldRecordsDto(
    int TrackId,
    string TrackName,
    GhostSubmissionDto? WorldRecord150,
    GhostSubmissionDto? WorldRecord200,
    GhostSubmissionDto? WorldRecord150Glitch,
    GhostSubmissionDto? WorldRecord200Glitch
);
