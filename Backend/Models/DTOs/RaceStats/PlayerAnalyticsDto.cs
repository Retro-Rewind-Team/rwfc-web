namespace RetroRewindWebsite.Models.DTOs.RaceStats;

public record PositionCountDto(int Position, int Count);

public record TrackPerformanceDto(
    short CourseId,
    string TrackName,
    int RaceCount,
    double WinRate,
    double AvgFinishPos,
    bool LowSample
);

public record PlayerAnalyticsDto(
    double WinRate,
    List<PositionCountDto> FinishPositionDistribution,
    List<TrackPerformanceDto> TrackPerformance,
    List<DayActivityDto> RacesByDayOfWeek,
    List<HourActivityDto> RacesByHour
);
