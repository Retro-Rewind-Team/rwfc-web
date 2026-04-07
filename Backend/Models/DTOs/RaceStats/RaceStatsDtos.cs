namespace RetroRewindWebsite.Models.DTOs.RaceStats;

public record TrackPlayCountDto(string TrackName, int RaceCount, short CourseId);

public record RecentRaceDto(
    string TrackName,
    short CourseId,
    string FinishTimeDisplay,
    string CharacterName,
    string VehicleName,
    DateTime Timestamp
);

public record SetupEntryDto(string Name, int RaceCount);

public record PlayerRaceStatsDto(
    int TotalRaces,
    DateTime TrackedSince,
    List<TrackPlayCountDto> TopTracks,
    List<SetupEntryDto> TopCharacters,
    List<SetupEntryDto> TopVehicles,
    List<SetupEntryDto> TopCombos,
    long TotalFramesIn1st,
    double AvgFramesIn1stPerRace,
    List<RecentRaceDto> RecentRaces,
    int CurrentPage,
    int PageSize,
    int TotalPages,
    int TotalRecentRaces
);

public record ActivePlayerDto(string Name, string Pid, string Fc, int RaceCount);

public record DayActivityDto(string DayName, int RaceCount);

public record HourActivityDto(int Hour, int RaceCount);

public record GlobalRaceStatsDto(
    int TotalRacesTracked,
    int UniquePlayersCount,
    DateTime TrackedSince,
    List<TrackPlayCountDto> AllPlayedTracks,
    List<SetupEntryDto> TopCharacters,
    List<SetupEntryDto> TopVehicles,
    List<SetupEntryDto> TopCombos,
    List<ActivePlayerDto> MostActivePlayers,
    List<DayActivityDto> RacesByDayOfWeek,
    List<HourActivityDto> RacesByHour
);
