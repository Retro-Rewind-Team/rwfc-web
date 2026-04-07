namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record TrackDto(
    int Id,
    string Name,
    short CourseId,
    string Category,
    short Laps,
    bool SupportsGlitch,
    int SortOrder
);
