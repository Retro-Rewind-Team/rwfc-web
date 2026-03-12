namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record TrackDto(
    int Id,
    string Name,
    string TrackSlot,
    short CourseId,
    string Category,
    short Laps,
    bool SupportsGlitch,
    int SortOrder
);
