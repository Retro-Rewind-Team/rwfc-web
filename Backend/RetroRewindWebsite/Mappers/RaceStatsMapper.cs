using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.RaceStats;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Mappers;

/// <summary>
/// Maps raw race result data and player entities to race statistics DTOs.
/// Track name lookups are pre-built by the caller and passed in as dictionaries.
/// </summary>
public static class RaceStatsMapper
{
    private static readonly string[] DayNames =
        ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    /// <summary>
    /// Maps a player entity and optional race stats to the combined player stats DTO
    /// used by the full player stats endpoint.
    /// </summary>
    public static PlayerStatsDto ToPlayerStatsDto(PlayerEntity player, PlayerRaceStatsDto? raceStats) => new(
        Pid: player.Pid,
        Name: player.Name,
        Fc: player.Fc,
        Vr: player.Ev,
        Rank: player.Rank,
        LastSeen: player.LastSeen,
        IsSuspicious: player.IsSuspicious,
        VrGain24h: player.VRGainLast24Hours,
        VrGain7d: player.VRGainLastWeek,
        VrGain30d: player.VRGainLastMonth,
        RaceStats: raceStats
    );

    /// <summary>
    /// Maps raw character usage counts to named setup entries.
    /// </summary>
    public static List<SetupEntryDto> MapCharacterEntries(List<(short Id, int Count)> raw)
        => [.. raw.Select(x => new SetupEntryDto(MarioKartMappings.GetCharacterName(x.Id), x.Count))];

    /// <summary>
    /// Maps raw vehicle usage counts to named setup entries.
    /// </summary>
    public static List<SetupEntryDto> MapVehicleEntries(List<(short Id, int Count)> raw)
        => [.. raw.Select(x => new SetupEntryDto(MarioKartMappings.GetVehicleName(x.Id), x.Count))];

    /// <summary>
    /// Maps raw character+vehicle combo usage counts to named setup entries.
    /// </summary>
    public static List<SetupEntryDto> MapCombos(List<(short CharacterId, short VehicleId, int Count)> raw)
        => [.. raw.Select(x => new SetupEntryDto(
            MarioKartMappings.GetComboName(x.CharacterId, x.VehicleId),
            x.Count))];

    /// <summary>
    /// Maps raw track play counts to DTOs, filtering out any course IDs not present in
    /// the provided track name lookup.
    /// </summary>
    /// <param name="raw">Raw (CourseId, Count) pairs from the repository.</param>
    /// <param name="trackNames">Map of CourseId → display name, pre-built from the track repository.</param>
    public static List<TrackPlayCountDto> MapTrackPlayCounts(
        List<(short CourseId, int Count)> raw,
        Dictionary<short, string> trackNames)
        => [.. raw
            .Where(t => trackNames.ContainsKey(t.CourseId))
            .Select(t => new TrackPlayCountDto(trackNames[t.CourseId], t.Count, t.CourseId))];

    /// <summary>
    /// Maps raw race result entities to recent race DTOs.
    /// Course IDs not found in <paramref name="trackNames"/> fall back to "Course {id}".
    /// </summary>
    /// <param name="raw">Race result rows from the repository.</param>
    /// <param name="trackNames">Map of CourseId → display name, pre-built from the track repository.</param>
    public static List<RecentRaceDto> MapRecentRaces(
        List<RaceResultEntity> raw,
        Dictionary<short, string> trackNames)
        => [.. raw.Select(r => new RecentRaceDto(
            trackNames.TryGetValue(r.CourseId, out var name) ? name : $"Course {r.CourseId}",
            r.CourseId,
            FormatFinishTime(r.FinishTime),
            MarioKartMappings.GetCharacterName(r.CharacterId),
            MarioKartMappings.GetVehicleName(r.VehicleId),
            r.RaceTimestamp))];

    /// <summary>
    /// Maps most-active player data to DTOs, resolving names and friend codes from
    /// the provided player lookup. Falls back to "Player {id}" / empty FC when a
    /// player is not in the lookup.
    /// </summary>
    /// <param name="raw">Raw (ProfileId, Count) pairs from the repository.</param>
    /// <param name="playerMap">Map of PID string → (Name, FriendCode), pre-built from the player repository.</param>
    public static List<ActivePlayerDto> MapActivePlayers(
        List<(long ProfileId, int Count)> raw,
        Dictionary<string, (string Name, string Fc)> playerMap)
        => [.. raw.Select(x =>
        {
            var (name, fc) = playerMap.TryGetValue(x.ProfileId.ToString(), out var info)
                ? info
                : ($"Player {x.ProfileId}", "");
            return new ActivePlayerDto(name, x.ProfileId.ToString(), fc, x.Count);
        })];

    /// <summary>
    /// Maps raw day-of-week race counts to a full 7-entry list (Sun–Sat), filling
    /// missing days with zero.
    /// </summary>
    public static List<DayActivityDto> MapDayActivity(List<(int DayOfWeek, int Count)> raw)
    {
        var dayMap = raw.ToDictionary(x => x.DayOfWeek, x => x.Count);
        return [.. Enumerable.Range(0, 7)
            .Select(d => new DayActivityDto(DayNames[d], dayMap.TryGetValue(d, out var c) ? c : 0))];
    }

    /// <summary>
    /// Maps raw hourly race counts to a full 24-entry list (0–23), filling missing
    /// hours with zero.
    /// </summary>
    public static List<HourActivityDto> MapHourActivity(List<(int Hour, int Count)> raw)
    {
        var hourMap = raw.ToDictionary(x => x.Hour, x => x.Count);
        return [.. Enumerable.Range(0, 24)
            .Select(h => new HourActivityDto(h, hourMap.TryGetValue(h, out var c) ? c : 0))];
    }

    /// <summary>
    /// Converts a raw IEEE 754 float finish time (stored as an int bit pattern) to a
    /// human-readable "m:ss.mmm" display string. Returns "N/A" for invalid values.
    /// </summary>
    public static string FormatFinishTime(int rawValue)
    {
        if (rawValue == 0)
            return "N/A";

        float totalSeconds = BitConverter.Int32BitsToSingle(rawValue);

        if (totalSeconds <= 0 || float.IsNaN(totalSeconds) || float.IsInfinity(totalSeconds))
            return "N/A";

        int minutes = (int)(totalSeconds / 60);
        float remainingSeconds = totalSeconds % 60;
        return $"{minutes}:{remainingSeconds:00.000}";
    }
}
