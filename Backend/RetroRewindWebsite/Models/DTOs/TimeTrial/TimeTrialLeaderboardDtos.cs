namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record TrackLeaderboardDto(
    TrackDto Track,
    short CC,
    bool GlitchAllowed,
    bool? Shroomless,
    string? VehicleFilter,
    List<GhostSubmissionDto> Submissions,
    int TotalSubmissions,
    int CurrentPage,
    int PageSize,
    int TotalPages,
    int? FastestLapMs,
    string? FastestLapDisplay
);

public record TrackWorldRecordsDto(
    int TrackId,
    string TrackName,
    GhostSubmissionDto? ActiveWorldRecord
);

public record FlapDto(
    int FastestLapMs,
    string FastestLapDisplay
);

public record PagedSubmissionsDto(
    List<GhostSubmissionDto> Submissions,
    int TotalSubmissions,
    int CurrentPage,
    int PageSize,
    int TotalPages
);
