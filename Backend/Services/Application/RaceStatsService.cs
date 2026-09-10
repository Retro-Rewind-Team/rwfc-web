using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.Domain;
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
    private readonly IMemoryCache _cache;
    private readonly RaceStatsCacheOptions _cacheOptions;
    private readonly ILogger<RaceStatsService> _logger;

    private const int TopSetupCount = 5;
    private const int GlobalMinRaces = 50;
    private const int PlayerMinRaces = 20;

    public RaceStatsService(
        IRaceStatsRepository raceStatsRepository,
        IPlayerRepository playerRepository,
        ITrackRepository trackRepository,
        IMemoryCache cache,
        IOptions<RaceStatsCacheOptions> cacheOptions,
        ILogger<RaceStatsService> logger)
    {
        _raceStatsRepository = raceStatsRepository;
        _playerRepository = playerRepository;
        _trackRepository = trackRepository;
        _cache = cache;
        _cacheOptions = cacheOptions.Value;
        _logger = logger;
    }

    /// <summary>
    /// Serves <paramref name="factory"/> from the memory cache for <paramref name="ttlSeconds"/>.
    /// A non-positive TTL bypasses the cache entirely. Entries carry Size = 1 because the shared
    /// cache is configured with a SizeLimit.
    /// </summary>
    private async Task<T?> GetOrComputeAsync<T>(string key, int ttlSeconds, Func<Task<T?>> factory)
        where T : class
    {
        if (ttlSeconds <= 0)
            return await factory();

        if (_cache.TryGetValue<T>(key, out var cached) && cached is not null)
            return cached;

        var value = await factory();

        // Null means "no such player"; caching that would hide a player appearing.
        if (value is not null)
        {
            _cache.Set(key, value, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(ttlSeconds),
                Size = 1
            });
        }

        return value;
    }

    public Task<PlayerRaceStatsDto?> GetPlayerRaceStatsAsync(
        string pid,
        int? days,
        short? courseId,
        short? engineClassId,
        int page,
        int pageSize) =>
        GetOrComputeAsync(
            $"race-stats:player:{pid}:{days}:{courseId}:{engineClassId}:{page}:{pageSize}",
            _cacheOptions.PlayerSeconds,
            () => BuildPlayerRaceStatsAsync(pid, days, courseId, engineClassId, page, pageSize));

    private async Task<PlayerRaceStatsDto?> BuildPlayerRaceStatsAsync(
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

        if (!long.TryParse(pid, out var profileId))
            return null;

        var after = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        var totalRaces = await _raceStatsRepository.GetTotalRaceCountByPlayerAsync(profileId, after, courseId, engineClassId);
        if (totalRaces == 0)
            return null;

        // Sequential on the request-scoped repository. These previously ran concurrently, each in
        // its own DI scope and therefore its own pooled connection -- more connections for a
        // single request than the pool holds, so one request could exhaust the pool and stall
        // waiting on itself. The cache above is what keeps the repeat cost down.
        var trackedSince = await _raceStatsRepository.GetEarliestRaceTimestampAsync() ?? DateTime.UtcNow;

        var topTracksRaw = courseId.HasValue
            ? []
            : await _raceStatsRepository.GetTopTracksByPlayerAsync(profileId, 5, after, courseId, engineClassId);

        var topCharactersRaw = await _raceStatsRepository.GetTopCharactersByPlayerAsync(profileId, TopSetupCount, after, courseId, engineClassId);
        var topVehiclesRaw = await _raceStatsRepository.GetTopVehiclesByPlayerAsync(profileId, TopSetupCount, after, courseId, engineClassId);
        var topCombosRaw = await _raceStatsRepository.GetTopCombosByPlayerAsync(profileId, TopSetupCount, after, courseId, engineClassId);
        var totalFramesIn1st = await _raceStatsRepository.GetTotalFramesIn1stByPlayerAsync(profileId, after, courseId, engineClassId);
        var (recentRaw, totalRecentCount) = await _raceStatsRepository.GetRecentRacesByPlayerAsync(profileId, page, pageSize, after, courseId, engineClassId);
        var topCharsByWinRate = await _raceStatsRepository.GetTopCharactersByWinRateByPlayerAsync(profileId, PlayerMinRaces, after, courseId, engineClassId);
        var topVehiclesByWinRate = await _raceStatsRepository.GetTopVehiclesByWinRateByPlayerAsync(profileId, PlayerMinRaces, after, courseId, engineClassId);
        var topCombosByWinRate = await _raceStatsRepository.GetTopCombosByWinRateByPlayerAsync(profileId, PlayerMinRaces, after, courseId, engineClassId);

        var topTrackNames = await BuildTrackNameMapAsync([.. topTracksRaw.Select(t => t.CourseId)]);
        var recentTrackNames = await BuildTrackNameMapAsync([.. recentRaw.Select(r => r.CourseId).Distinct()]);

        var topTracks = courseId.HasValue ? [] : RaceStatsMapper.MapTrackPlayCounts(topTracksRaw, topTrackNames);
        var topCharacters = RaceStatsMapper.MapCharacterEntries(topCharactersRaw);
        var topVehicles = RaceStatsMapper.MapVehicleEntries(topVehiclesRaw);
        var topCombos = RaceStatsMapper.MapCombos(topCombosRaw);
        var recentRaces = RaceStatsMapper.MapRecentRaces(recentRaw, recentTrackNames);
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
                [.. topCharsByWinRate.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopVehiclesByWinRate: RaceStatsMapper.MapVehicleWinRates(
                [.. topVehiclesByWinRate.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopCombosByWinRate: RaceStatsMapper.MapComboWinRates(
                [.. topCombosByWinRate.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopCharactersByWinCount: RaceStatsMapper.MapCharacterWinRates(
                [.. topCharsByWinRate.OrderByDescending(x => x.WinCount).Take(TopSetupCount)]),
            TopVehiclesByWinCount: RaceStatsMapper.MapVehicleWinRates(
                [.. topVehiclesByWinRate.OrderByDescending(x => x.WinCount).Take(TopSetupCount)]),
            TopCombosByWinCount: RaceStatsMapper.MapComboWinRates(
                [.. topCombosByWinRate.OrderByDescending(x => x.WinCount).Take(TopSetupCount)])
        );
    }

    public async Task<GlobalRaceStatsDto> GetGlobalRaceStatsAsync(int? days)
    {
        var cached = await GetOrComputeAsync(
            $"race-stats:global:{days}",
            _cacheOptions.GlobalSeconds,
            () => BuildGlobalRaceStatsAsync(days));

        // The builder never returns null; the nullable signature is only there to satisfy the
        // shared cache helper, which treats null as "do not cache".
        return cached!;
    }

    private async Task<GlobalRaceStatsDto?> BuildGlobalRaceStatsAsync(int? days)
    {
        var after = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        // Sequential on the request-scoped repository. Thirteen of these previously ran at once,
        // each in its own DI scope holding its own pooled connection, against a pool of ten -- a
        // single request could exhaust the pool and time out waiting on itself.
        var totalRaces = await _raceStatsRepository.GetTotalRaceCountAsync(after);
        var uniquePlayers = await _raceStatsRepository.GetUniquePlayerCountAsync(after);
        var trackedSince = await _raceStatsRepository.GetEarliestRaceTimestampAsync();
        var allTracksRaw = await _raceStatsRepository.GetAllPlayedTracksAsync(after);
        var topCharactersRaw = await _raceStatsRepository.GetTopCharactersAsync(TopSetupCount, after);
        var topVehiclesRaw = await _raceStatsRepository.GetTopVehiclesAsync(TopSetupCount, after);
        var topCombosRaw = await _raceStatsRepository.GetTopCombosAsync(TopSetupCount, after);
        var activePlayersRaw = await _raceStatsRepository.GetMostActivePlayersAsync(10, after);
        var racesByDay = await _raceStatsRepository.GetRaceCountByDayOfWeekAsync(after);
        var racesByHour = await _raceStatsRepository.GetRaceCountByHourAsync(after);
        var topCharsByWinRate = await _raceStatsRepository.GetTopCharactersByWinRateAsync(GlobalMinRaces, after);
        var topVehiclesByWinRate = await _raceStatsRepository.GetTopVehiclesByWinRateAsync(GlobalMinRaces, after);
        var topCombosByWinRate = await _raceStatsRepository.GetTopCombosByWinRateAsync(GlobalMinRaces, after);

        var trackNames = await BuildTrackNameMapAsync([.. allTracksRaw.Select(t => t.CourseId)]);

        var activePids = activePlayersRaw.Select(x => x.ProfileId.ToString()).ToList();
        var activePlayers = await _playerRepository.GetPlayersByPidsAsync(activePids);
        var playerMap = activePlayers.ToDictionary(p => p.Pid, p => (p.Name, p.Fc));

        return new GlobalRaceStatsDto(
            TotalRacesTracked: totalRaces,
            UniquePlayersCount: uniquePlayers,
            TrackedSince: trackedSince ?? DateTime.UtcNow,
            AllPlayedTracks: RaceStatsMapper.MapTrackPlayCounts(allTracksRaw, trackNames),
            TopCharacters: RaceStatsMapper.MapCharacterEntries(topCharactersRaw),
            TopVehicles: RaceStatsMapper.MapVehicleEntries(topVehiclesRaw),
            TopCombos: RaceStatsMapper.MapCombos(topCombosRaw),
            MostActivePlayers: RaceStatsMapper.MapActivePlayers(activePlayersRaw, playerMap),
            RacesByDayOfWeek: RaceStatsMapper.MapDayActivity(racesByDay),
            RacesByHour: RaceStatsMapper.MapHourActivity(racesByHour),
            TopCharactersByWinRate: RaceStatsMapper.MapCharacterWinRates(
                [.. topCharsByWinRate.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopVehiclesByWinRate: RaceStatsMapper.MapVehicleWinRates(
                [.. topVehiclesByWinRate.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopCombosByWinRate: RaceStatsMapper.MapComboWinRates(
                [.. topCombosByWinRate.OrderByDescending(x => x.WinRate).Take(TopSetupCount)]),
            TopCharactersByWinCount: RaceStatsMapper.MapCharacterWinRates(
                [.. topCharsByWinRate.OrderByDescending(x => x.WinCount).Take(TopSetupCount)]),
            TopVehiclesByWinCount: RaceStatsMapper.MapVehicleWinRates(
                [.. topVehiclesByWinRate.OrderByDescending(x => x.WinCount).Take(TopSetupCount)]),
            TopCombosByWinCount: RaceStatsMapper.MapComboWinRates(
                [.. topCombosByWinRate.OrderByDescending(x => x.WinCount).Take(TopSetupCount)])
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
        var tracks = await _trackRepository.GetTracksByCourseIdsAsync(courseIds);
        return tracks
            .GroupBy(t => t.CourseId)
            .ToDictionary(g => g.Key, g => string.Join(" / ", g.Select(t => t.Name)));
    }

    public Task<PlayerAnalyticsDto?> GetPlayerAnalyticsAsync(
        string pid, int? days, short? engineClassId) =>
        GetOrComputeAsync(
            $"race-stats:analytics:{pid}:{days}:{engineClassId}",
            _cacheOptions.PlayerSeconds,
            () => BuildPlayerAnalyticsAsync(pid, days, engineClassId));

    private async Task<PlayerAnalyticsDto?> BuildPlayerAnalyticsAsync(
        string pid, int? days, short? engineClassId)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        if (!long.TryParse(pid, out var profileId))
            return null;

        var after = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        var totalRaces = await _raceStatsRepository.GetTotalRaceCountByPlayerAsync(
            profileId, after, null, engineClassId);
        if (totalRaces == 0)
            return null;

        var posDist = await _raceStatsRepository.GetFinishPositionDistributionAsync(profileId, after, engineClassId);
        var trackPerf = await _raceStatsRepository.GetTrackPerformanceByPlayerAsync(profileId, after, engineClassId);
        var byDay = await _raceStatsRepository.GetRaceCountByDayOfWeekByPlayerAsync(profileId, after, engineClassId);
        var byHour = await _raceStatsRepository.GetRaceCountByHourByPlayerAsync(profileId, after, engineClassId);

        var trackNameMap = await BuildTrackNameMapAsync([.. trackPerf.Select(t => t.CourseId)]);

        return RaceStatsMapper.MapPlayerAnalytics(
            totalRaces, posDist, trackPerf, trackNameMap, byDay, byHour);
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

            // A PID that is not numeric has no race results to find; treat it as no match rather
            // than letting a FormatException surface as a 500.
            if (!long.TryParse(player.Pid, out var parsedProfileId))
                return new PagedResult<RaceResultDto>([], 0, page, pageSize);

            profileId = parsedProfileId;
        }

        var (raceKeys, totalCount) = await _raceStatsRepository.GetDistinctRacesAsync(
            roomId, raceNumber, courseId, engineClassId, profileId, from, to, page, pageSize);

        if (raceKeys.Count == 0)
            return new PagedResult<RaceResultDto>([], totalCount, page, pageSize);

        var participants = await _raceStatsRepository.GetParticipantsByRaceKeysAsync(raceKeys);

        var courseIds = raceKeys.Select(k => k.CourseId).Distinct().ToList();
        var trackNameMap = await BuildTrackNameMapAsync(courseIds);

        var profileIdStrings = participants.Select(p => p.ProfileId.ToString()).Distinct().ToList();
        var playerEntities = await _playerRepository.GetPlayersByPidsAsync(profileIdStrings);
        var playerMap = playerEntities.ToDictionary(p => p.Pid, p => (p.Name, p.Fc));

        var items = RaceStatsMapper.MapRaces(raceKeys, participants, trackNameMap, playerMap);
        return new PagedResult<RaceResultDto>(items, totalCount, page, pageSize);
    }

    public async Task<TrackOnlineBestsResultDto> GetTrackOnlineBestsAsync(
        short courseId, short? engineClassId, int page, int pageSize)
    {
        var (rows, totalCount, avgSeconds) = await _raceStatsRepository.GetTrackOnlineBestsAsync(
            courseId, engineClassId, page, pageSize);

        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

        string? avgDisplay = avgSeconds.HasValue
            ? RaceStatsMapper.FormatFinishTime(BitConverter.SingleToInt32Bits(avgSeconds.Value))
            : null;

        if (rows.Count == 0)
            return new TrackOnlineBestsResultDto([], totalCount, page, pageSize, totalPages,
                page < totalPages, page > 1, avgDisplay);

        var pids = rows.Select(r => r.ProfileId.ToString()).ToList();
        var players = await _playerRepository.GetPlayersByPidsAsync(pids);
        // Skip rather than throw on a non-numeric PID: the row simply falls back to its placeholder
        // name below.
        var playerMap = players
            .Select(p => (Parsed: long.TryParse(p.Pid, out var id), Id: id, p.Name, p.Fc))
            .Where(x => x.Parsed)
            .ToDictionary(x => x.Id, x => (x.Name, x.Fc));

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

        if (!long.TryParse(pid, out var profileId))
            return null;

        var rows = await _raceStatsRepository.GetPlayerOnlineBestsAsync(profileId);

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
