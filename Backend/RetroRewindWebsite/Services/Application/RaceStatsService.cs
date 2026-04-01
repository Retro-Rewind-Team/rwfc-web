using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.RaceStats;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Repositories.RaceResult;
using RetroRewindWebsite.Repositories.TimeTrial;

namespace RetroRewindWebsite.Services.Application;

public class RaceStatsService : IRaceStatsService
{
    private readonly IRaceStatsRepository _raceStatsRepository;
    private readonly IPlayerRepository _playerRepository;
    private readonly ITrackRepository _trackRepository;
    private readonly ILogger<RaceStatsService> _logger;

    private const int TopSetupCount = 5;

    public RaceStatsService(
        IRaceStatsRepository raceStatsRepository,
        IPlayerRepository playerRepository,
        ITrackRepository trackRepository,
        ILogger<RaceStatsService> logger)
    {
        _raceStatsRepository = raceStatsRepository;
        _playerRepository = playerRepository;
        _trackRepository = trackRepository;
        _logger = logger;
    }

    public async Task<PlayerRaceStatsDto?> GetPlayerRaceStatsAsync(
        string pid,
        int? days,
        short? courseId,
        int page,
        int pageSize)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        var profileId = long.Parse(pid);
        var after = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        var totalRaces = await _raceStatsRepository.GetTotalRaceCountByPlayerAsync(profileId, after, courseId);
        if (totalRaces == 0)
            return null;

        var trackedSince = await _raceStatsRepository.GetEarliestRaceTimestampAsync()
            ?? DateTime.UtcNow;

        // Top tracks, omitted when filtering to a single course
        List<TrackPlayCountDto> topTracks = [];
        if (!courseId.HasValue)
        {
            var topTrackRaw = await _raceStatsRepository.GetTopTracksByPlayerAsync(profileId, 5, after, courseId);
            var trackNames = await BuildTrackNameMapAsync(topTrackRaw.Select(t => t.CourseId).ToList());
            topTracks = RaceStatsMapper.MapTrackPlayCounts(topTrackRaw, trackNames);
        }

        var topCharacters = RaceStatsMapper.MapCharacterEntries(
            await _raceStatsRepository.GetTopCharactersByPlayerAsync(profileId, TopSetupCount, after, courseId));

        var topVehicles = RaceStatsMapper.MapVehicleEntries(
            await _raceStatsRepository.GetTopVehiclesByPlayerAsync(profileId, TopSetupCount, after, courseId));

        var topCombos = RaceStatsMapper.MapCombos(
            await _raceStatsRepository.GetTopCombosByPlayerAsync(profileId, TopSetupCount, after, courseId));

        var totalFramesIn1st = await _raceStatsRepository.GetTotalFramesIn1stByPlayerAsync(profileId, after, courseId);
        var avgFramesIn1st = totalRaces > 0 ? (double)totalFramesIn1st / totalRaces : 0;

        var (recentRaw, totalRecentCount) = await _raceStatsRepository.GetRecentRacesByPlayerAsync(
            profileId, page, pageSize, after, courseId);

        var recentTrackNames = await BuildTrackNameMapAsync(
            recentRaw.Select(r => r.CourseId).Distinct().ToList());
        var recentRaces = RaceStatsMapper.MapRecentRaces(recentRaw, recentTrackNames);

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
            TotalRecentRaces: totalRecentCount
        );
    }

    public async Task<GlobalRaceStatsDto> GetGlobalRaceStatsAsync(int? days)
    {
        var after = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        var totalRaces = await _raceStatsRepository.GetTotalRaceCountAsync(after);
        var uniquePlayers = await _raceStatsRepository.GetUniquePlayerCountAsync(after);
        var trackedSince = await _raceStatsRepository.GetEarliestRaceTimestampAsync()
            ?? DateTime.UtcNow;

        var allTracksRaw = await _raceStatsRepository.GetAllPlayedTracksAsync(after);
        var trackNames = await BuildTrackNameMapAsync(allTracksRaw.Select(t => t.CourseId).ToList());
        var allPlayedTracks = RaceStatsMapper.MapTrackPlayCounts(allTracksRaw, trackNames);

        var topCharacters = RaceStatsMapper.MapCharacterEntries(
            await _raceStatsRepository.GetTopCharactersAsync(TopSetupCount, after));

        var topVehicles = RaceStatsMapper.MapVehicleEntries(
            await _raceStatsRepository.GetTopVehiclesAsync(TopSetupCount, after));

        var topCombos = RaceStatsMapper.MapCombos(
            await _raceStatsRepository.GetTopCombosAsync(TopSetupCount, after));

        var activePlayersRaw = await _raceStatsRepository.GetMostActivePlayersAsync(10, after);
        var activePids = activePlayersRaw.Select(x => x.ProfileId.ToString()).ToList();
        var activePlayers = await _playerRepository.GetPlayersByPidsAsync(activePids);
        var playerMap = activePlayers.ToDictionary(p => p.Pid, p => (p.Name, p.Fc));
        var mostActivePlayers = RaceStatsMapper.MapActivePlayers(activePlayersRaw, playerMap);

        var racesByDay = RaceStatsMapper.MapDayActivity(
            await _raceStatsRepository.GetRaceCountByDayOfWeekAsync(after));

        var racesByHour = RaceStatsMapper.MapHourActivity(
            await _raceStatsRepository.GetRaceCountByHourAsync(after));

        return new GlobalRaceStatsDto(
            TotalRacesTracked: totalRaces,
            UniquePlayersCount: uniquePlayers,
            TrackedSince: trackedSince,
            AllPlayedTracks: allPlayedTracks,
            TopCharacters: topCharacters,
            TopVehicles: topVehicles,
            TopCombos: topCombos,
            MostActivePlayers: mostActivePlayers,
            RacesByDayOfWeek: racesByDay,
            RacesByHour: racesByHour
        );
    }

    public async Task<PlayerStatsDto?> GetPlayerFullStatsAsync(string pid)
    {
        var player = await _playerRepository.GetByPidAsync(pid);
        if (player == null)
            return null;

        // Race stats are optional, null if player has no race data
        var raceStats = await GetPlayerRaceStatsAsync(pid, null, null, 1, 20);

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
}
