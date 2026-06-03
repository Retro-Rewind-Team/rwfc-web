namespace RetroRewindWebsite.Models.DTOs.RaceStats;

public record TrackOnlineBestsResultDto(
    List<TrackOnlineBestDto> Items,
    int TotalCount,
    int CurrentPage,
    int PageSize,
    int TotalPages,
    bool HasNextPage,
    bool HasPreviousPage,
    string? AverageTimeDisplay
);
