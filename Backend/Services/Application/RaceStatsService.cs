using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.DTOs.RaceStats;
using RetroRewindWebsite.Models.DTOs.Room;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Repositories.RaceResult;
using RetroRewindWebsite.Repositories.TimeTrial;

namespace RetroRewindWebsite.Services.Application;

/// <summary>
/// Aggregates race result data into per-player and global statistics, including analytics and filtered race queries.
/// </summary>
public class RaceStatsService : IRaceStatsService
{
    private readonly IRaceStatsRepository _raceStatsRepository;
    private readonly IPlayerRepository _playerRepository;
    private readonly ITrackRepository _trackRepository;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<RaceStatsService> _logger;

    private const int TopSetupCount = 5;
    private const int GlobalMinRaces = 50;
    private const int PlayerMinRaces = 20;

    public RaceStatsService(
        IRaceStatsRepository raceStatsRepository,
        IPlayerRepository playerRepository,
        ITrackRepository trackRepository,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<RaceStatsService> logger)
    {
        _raceStatsRepository = raceStatsRepository;
        _playerRepository = playerRepository;
        _trackRepository = trackRepository;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task<PlayerRaceStatsDto?> GetPlayerRaceStatsAsync(
        string pid,
        int? days,
        short? courseId,
        short? engineClassId,
        int page,
        int pageSize)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        var profileId = long.Parse(pid);
        var after = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        var totalRaces = await _raceStatsRepository.GetTotalRaceCountByPlayerAsync(profileId, after, courseId, engineClassId);
        if (totalRaces == 0)
            return null;

        // All remaining queries are independent, run them in parallel, each in its own scope
        var trackedSinceTask = StatsQuery(r => r.GetEarliestRaceTimestampAsync());
        var topTracksRawTask = courseId.HasValue
            ? Task.FromResult<List<(short CourseId, int Count)>>([])
            : StatsQuery(r => r.GetTopTracksByPlayerAsync(profileId, 5, after, courseId, engineClassId));
        var topCharactersTask = StatsQuery(r => r.GetTopCharactersByPlayerAsync(profileId, TopSetupCount, after, courseId, engineClassId));
        var topVehiclesTask = StatsQuery(r => r.GetTopVehiclesByPlayerAsync(profileId, TopSetupCount, after, courseId, engineClassId));
        var topCombosTask = StatsQuery(r => r.GetTopCombosByPlayerAsync(profileId, TopSetupCount, after, courseId, engineClassId));
        var totalFramesIn1stTask = StatsQuery(r => r.GetTotalFramesIn1stByPlayerAsync(profileId, after, courseId, engineClassId));
        var recentTask = StatsQuery(r => r.GetRecentRacesByPlayerAsync(profileId, page, pageSize, after, courseId, engineClassId));
        var topCharsByWinRateTask = StatsQuery(r => r.GetTopCharactersByWinRateByPlayerAsync(profileId, PlayerMinRaces, after, courseId, engineClassId));
        var topVehiclesByWinRateTask = StatsQuery(r => r.GetTopVehiclesByWinRateByPlayerAsync(profileId, PlayerMinRaces, after, courseId, engineClassId));
        var topCombosByWinRateTask = StatsQuery(r => r.GetTopCombosByWinRateByPlayerAsync(profileId, PlayerMinRaces, after, courseId, engineClassId));

        await Task.WhenAll(trackedSinceTask, topTracksRawTask, topCharactersTask,
            topVehiclesTask, topCombosTask, totalFramesIn1stTask, recentTask,
            topCharsByWinRateTask, topVehiclesByWinRateTask, topCombosByWinRateTask);

        var trackedSince = trackedSinceTask.Result ?? DateTime.UtcNow;
        var topTracksRaw = topTracksRawTask.Result;
        var totalFramesIn1st = totalFramesIn1stTask.Result;
        var (recentRaw, totalRecentCount) = recentTask.Result;

        // Track name lookups depend on previous results, run in parallel with each other
        var topTrackNamesTask = BuildTrackNameMapAsync([.. topTracksRaw.Select(t => t.CourseId)]);
        var recentTrackNamesTask = BuildTrackNameMapAsync([.. recentRaw.Select(r => r.CourseId).Distinct()]);
        await Task.WhenAll(topTrackNamesTask, recentTrackNamesTask);

        var topTracks = courseId.HasValue ? [] : RaceStatsMapper.MapTrackPlayCounts(topTracksRaw, topTrackNamesTask.Result);
        var topCharacters = RaceStatsMapper.MapCharacterEntries(topCharactersTask.Result);
        var topVehicles = RaceStatsMapper.MapVehicleEntries(topVehiclesTask.Result);
        var topCombos = RaceStatsMapper.MapCombos(topCombosTask.Result);
        var recentRaces = RaceStatsMapper.MapRecentRaces(recentRaw, recentTrackNamesTask.Result);
        var avgFramesIn1st = totalRaces > 0 ? (double)totalFramesIn1st / totalRaces : 0;
        var totalPages = (int)Math.Ceiling((double)totalRecentCount / pageSize);

        return new PlayerRaceStatsDto(
            TotalRaces: totalRaces,
            TrackedSince: trackedSince,
            TopTracks: topTracks,
            TopCharacters: topCharacters,
            TopVehicles: topVehicles,
            TopCombos: topCombos,
            TotalFramesIn1st: totalFramesIn1st,
            AvgFramesIn1stPerRace: Math.Round(avgFramesIn1st, 1),
            RecentRaces: recentRaces,
            CurrentPage: page,
            PageSize: pageSize,
            TotalPages: totalPages,
            TotalRecentRaces: totalRecentCount,
            TopCharactersByWinRate: RaceStatsMapper.MapCharacterWinRates(
                [.. topCharsByWinRateTask.Result.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopVehiclesByWinRate: RaceStatsMapper.MapVehicleWinRates(
                [.. topVehiclesByWinRateTask.Result.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopCombosByWinRate: RaceStatsMapper.MapComboWinRates(
                [.. topCombosByWinRateTask.Result.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopCharactersByWinCount: RaceStatsMapper.MapCharacterWinRates(
                [.. topCharsByWinRateTask.Result.OrderByDescending(x => x.WinCount).Take(TopSetupCount)]),
            TopVehiclesByWinCount: RaceStatsMapper.MapVehicleWinRates(
                [.. topVehiclesByWinRateTask.Result.OrderByDescending(x => x.WinCount).Take(TopSetupCount)]),
            TopCombosByWinCount: RaceStatsMapper.MapComboWinRates(
                [.. topCombosByWinRateTask.Result.OrderByDescending(x => x.WinCount).Take(TopSetupCount)])
        );
    }

    public async Task<GlobalRaceStatsDto> GetGlobalRaceStatsAsync(int? days)
    {
        var after = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        // All queries are independent. They run in parallel, each in its own scope
        var totalRacesTask = StatsQuery(r => r.GetTotalRaceCountAsync(after));
        var uniquePlayersTask = StatsQuery(r => r.GetUniquePlayerCountAsync(after));
        var trackedSinceTask = StatsQuery(r => r.GetEarliestRaceTimestampAsync());
        var allTracksRawTask = StatsQuery(r => r.GetAllPlayedTracksAsync(after));
        var topCharactersTask = StatsQuery(r => r.GetTopCharactersAsync(TopSetupCount, after));
        var topVehiclesTask = StatsQuery(r => r.GetTopVehiclesAsync(TopSetupCount, after));
        var topCombosTask = StatsQuery(r => r.GetTopCombosAsync(TopSetupCount, after));
        var activePlayersRawTask = StatsQuery(r => r.GetMostActivePlayersAsync(10, after));
        var racesByDayTask = StatsQuery(r => r.GetRaceCountByDayOfWeekAsync(after));
        var racesByHourTask = StatsQuery(r => r.GetRaceCountByHourAsync(after));
        var topCharsByWinRateTask = StatsQuery(r => r.GetTopCharactersByWinRateAsync(GlobalMinRaces, after));
        var topVehiclesByWinRateTask = StatsQuery(r => r.GetTopVehiclesByWinRateAsync(GlobalMinRaces, after));
        var topCombosByWinRateTask = StatsQuery(r => r.GetTopCombosByWinRateAsync(GlobalMinRaces, after));

        await Task.WhenAll(totalRacesTask, uniquePlayersTask, trackedSinceTask, allTracksRawTask,
            topCharactersTask, topVehiclesTask, topCombosTask, activePlayersRawTask,
            racesByDayTask, racesByHourTask,
            topCharsByWinRateTask, topVehiclesByWinRateTask, topCombosByWinRateTask);

        var allTracksRaw = allTracksRawTask.Result;
        var activePlayersRaw = activePlayersRawTask.Result;

        // Track name lookup and player name lookup depend on above results, run in parallel
        var trackNamesTask = BuildTrackNameMapAsync([.. allTracksRaw.Select(t => t.CourseId)]);
        var activePids = activePlayersRaw.Select(x => x.ProfileId.ToString()).ToList();
        var activePlayersTask = PlayerQuery(r => r.GetPlayersByPidsAsync(activePids));
        await Task.WhenAll(trackNamesTask, activePlayersTask);

        var playerMap = activePlayersTask.Result.ToDictionary(p => p.Pid, p => (p.Name, p.Fc));

        return new GlobalRaceStatsDto(
            TotalRacesTracked: totalRacesTask.Result,
            UniquePlayersCount: uniquePlayersTask.Result,
            TrackedSince: trackedSinceTask.Result ?? DateTime.UtcNow,
            AllPlayedTracks: RaceStatsMapper.MapTrackPlayCounts(allTracksRaw, trackNamesTask.Result),
            TopCharacters: RaceStatsMapper.MapCharacterEntries(topCharactersTask.Result),
            TopVehicles: RaceStatsMapper.MapVehicleEntries(topVehiclesTask.Result),
            TopCombos: RaceStatsMapper.MapCombos(topCombosTask.Result),
            MostActivePlayers: RaceStatsMapper.MapActivePlayers(activePlayersRaw, playerMap),
            RacesByDayOfWeek: RaceStatsMapper.MapDayActivity(racesByDayTask.Result),
            RacesByHour: RaceStatsMapper.MapHourActivity(racesByHourTask.Result),
            TopCharactersByWinRate: RaceStatsMapper.MapCharacterWinRates(
                [.. topCharsByWinRateTask.Result.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopVehiclesByWinRate: RaceStatsMapper.MapVehicleWinRates(
                [.. topVehiclesByWinRateTask.Result.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopCombosByWinRate: RaceStatsMapper.MapComboWinRates(
                [.. topCombosByWinRateTask.Result.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopCharactersByWinCount: RaceStatsMapper.MapCharacterWinRates(
                [.. topCharsByWinRateTask.Result.OrderByDescending(x => x.WinCount).Take(TopSetupCount)]),
            TopVehiclesByWinCount: RaceStatsMapper.MapVehicleWinRates(
                [.. topVehiclesByWinRateTask.Result.OrderByDescending(x => x.WinCount).Take(TopSetupCount)]),
            TopCombosByWinCount: RaceStatsMapper.MapComboWinRates(
                [.. topCombosByWinRateTask.Result.OrderByDescending(x => x.WinCount).Take(TopSetupCount)])
        );
    }

    public async Task<PlayerStatsDto?> GetPlayerFullStatsAsync(string pid)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        // Race stats are optional, null if player has no race data
        var raceStats = await GetPlayerRaceStatsAsync(pid, null, null, null, 1, 20);

        return RaceStatsMapper.ToPlayerStatsDto(player, raceStats);
    }

    /// <summary>
    /// Fetches track entities for the given course IDs and builds a CourseId → display name
    /// lookup. Tracks sharing a course ID are joined with " / " (e.g. retro variants).
    /// </summary>
    private async Task<Dictionary<short, string>> BuildTrackNameMapAsync(List<short> courseIds)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var trackRepo = scope.ServiceProvider.GetRequiredService<ITrackRepository>();
        var tracks = await trackRepo.GetTracksByCourseIdsAsync(courseIds);
        return tracks
            .GroupBy(t => t.CourseId)
            .ToDictionary(g => g.Key, g => string.Join(" / ", g.Select(t => t.Name)));
    }

    public async Task<PlayerAnalyticsDto?> GetPlayerAnalyticsAsync(
        string pid, int? days, short? engineClassId)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        var profileId = long.Parse(pid);
        var after = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        var totalRaces = await _raceStatsRepository.GetTotalRaceCountByPlayerAsync(
            profileId, after, null, engineClassId);
        if (totalRaces == 0)
            return null;

        var posDistTask = StatsQuery(r => r.GetFinishPositionDistributionAsync(profileId, after, engineClassId));
        var trackPerfTask = StatsQuery(r => r.GetTrackPerformanceByPlayerAsync(profileId, after, engineClassId));
        var dayTask = StatsQuery(r => r.GetRaceCountByDayOfWeekByPlayerAsync(profileId, after, engineClassId));
        var hourTask = StatsQuery(r => r.GetRaceCountByHourByPlayerAsync(profileId, after, engineClassId));

        await Task.WhenAll(posDistTask, trackPerfTask, dayTask, hourTask);

        var courseIds = trackPerfTask.Result.Select(t => t.CourseId).ToList();
        var trackNameMap = await BuildTrackNameMapAsync(courseIds);

        return RaceStatsMapper.MapPlayerAnalytics(
            totalRaces,
            posDistTask.Result,
            trackPerfTask.Result,
            trackNameMap,
            dayTask.Result,
            hourTask.Result);
    }

    /// <summary>Runs a stats repository query in an isolated scope so it can be used with Task.WhenAll.</summary>
    private async Task<T> StatsQuery<T>(Func<IRaceStatsRepository, Task<T>> query)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        return await query(scope.ServiceProvider.GetRequiredService<IRaceStatsRepository>());
    }

    /// <summary>Runs a player repository query in an isolated scope so it can be used with Task.WhenAll.</summary>
    private async Task<T> PlayerQuery<T>(Func<IPlayerRepository, Task<T>> query)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        return await query(scope.ServiceProvider.GetRequiredService<IPlayerRepository>());
    }

    public async Task<PagedResult<RaceResultDto>> GetRacesAsync(
        string? roomId,
        int? raceNumber,
        short? courseId,
        short? engineClassId,
        string? friendCode,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize)
    {
        // Resolve friendCode → profileId if provided
        long? profileId = null;
        if (!string.IsNullOrEmpty(friendCode))
        {
            var player = await _playerRepository.GetByFcAsync(friendCode);
            if (player == null)
                return new PagedResult<RaceResultDto>([], 0, page, pageSize);
            profileId = long.Parse(player.Pid);
        }

        var (raceKeys, totalCount) = await _raceStatsRepository.GetDistinctRacesAsync(
            roomId, raceNumber, courseId, engineClassId, profileId, from, to, page, pageSize);

        if (raceKeys.Count == 0)
            return new PagedResult<RaceResultDto>([], totalCount, page, pageSize);

        var participants = await _raceStatsRepository.GetParticipantsByRaceKeysAsync(raceKeys);

        var courseIds = raceKeys.Select(k => k.CourseId).Distinct().ToList();
        var trackNameMap = await BuildTrackNameMapAsync(courseIds);

        var profileIdStrings = participants.Select(p => p.ProfileId.ToString()).Distinct().ToList();
        var playerEntities = await PlayerQuery(r => r.GetPlayersByPidsAsync(profileIdStrings));
        var playerMap = playerEntities.ToDictionary(p => p.Pid, p => (p.Name, p.Fc));

        var items = RaceStatsMapper.MapRaces(raceKeys, participants, trackNameMap, playerMap);
        return new PagedResult<RaceResultDto>(items, totalCount, page, pageSize);
    }

    public async Task<TrackOnlineBestsResultDto> GetTrackOnlineBestsAsync(
        short courseId, short? engineClassId, int page, int pageSize)
    {
        var (rows, totalCount, avgSeconds) = await StatsQuery(r =>
            r.GetTrackOnlineBestsAsync(courseId, engineClassId, page, pageSize));

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        string? avgDisplay = avgSeconds.HasValue
            ? RaceStatsMapper.FormatFinishTime(BitConverter.SingleToInt32Bits(avgSeconds.Value))
            : null;

        if (rows.Count == 0)
            return new TrackOnlineBestsResultDto([], totalCount, page, pageSize, totalPages,
                page < totalPages, page > 1, avgDisplay);

        var pids = rows.Select(r => r.ProfileId.ToString()).ToList();
        var players = await PlayerQuery(r => r.GetPlayersByPidsAsync(pids));
        var playerMap = players.ToDictionary(p => long.Parse(p.Pid), p => (p.Name, p.Fc));

        var items = rows.Select((r, i) =>
        {
            var (name, fc) = playerMap.TryGetValue(r.ProfileId, out var info)
                ? info
                : ($"Player {r.ProfileId}", "");
            return new TrackOnlineBestDto(
                Rank: (page - 1) * pageSize + i + 1,
                PlayerName: name,
                Pid: r.ProfileId.ToString(),
                Fc: fc,
                FinishTimeDisplay: RaceStatsMapper.FormatFinishTime(r.FinishTime),
                AchievedAt: r.AchievedAt,
                GameMode: RoomDtoExtensions.GetRoomModeName(r.Rk)
            );
        }).ToList();

        return new TrackOnlineBestsResultDto(items, totalCount, page, pageSize, totalPages,
            page < totalPages, page > 1, avgDisplay);
    }

    public async Task<List<PlayerOnlineBestDto>?> GetPlayerOnlineBestsAsync(string pid)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        var profileId = long.Parse(pid);
        var rows = await StatsQuery(r => r.GetPlayerOnlineBestsAsync(profileId));

        if (rows.Count == 0)
            return [];

        var courseIds = rows.Select(r => r.CourseId).Distinct().ToList();
        var trackNameMap = await BuildTrackNameMapAsync(courseIds);

        return rows
            .Where(r => trackNameMap.ContainsKey(r.CourseId))
            .Select(r => new PlayerOnlineBestDto(
                TrackName: trackNameMap[r.CourseId],
                CourseId: r.CourseId,
                EngineClassId: r.EngineClassId,
                FinishTimeDisplay: RaceStatsMapper.FormatFinishTime(r.FinishTime),
                AchievedAt: r.AchievedAt,
                GameMode: RoomDtoExtensions.GetRoomModeName(r.Rk)
            )).ToList();
    }
}
