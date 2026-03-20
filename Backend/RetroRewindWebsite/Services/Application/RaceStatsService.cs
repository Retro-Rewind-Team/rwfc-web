using RetroRewindWebsite.Helpers;
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
    private static readonly string[] DayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

        // Top tracks — omit when filtered to a single course
        List<TrackPlayCountDto> topTracks = [];
        if (!courseId.HasValue)
        {
            var topTrackRaw = await _raceStatsRepository.GetTopTracksByPlayerAsync(profileId, 5, after, courseId);
            var trackIds = topTrackRaw.Select(t => t.CourseId).ToList();
            var tracks = await _trackRepository.GetTracksByCourseIdsAsync(trackIds);
            var trackNameMap = tracks
                .GroupBy(t => t.CourseId)
                .ToDictionary(g => g.Key, g => string.Join(" / ", g.Select(t => t.Name)));

            topTracks = [.. topTrackRaw
                .Select(t => new TrackPlayCountDto(
                    trackNameMap.TryGetValue(t.CourseId, out var name) ? name : $"Course {t.CourseId}",
                    t.Count,
                    t.CourseId))];
        }

        // Top characters, vehicles, combos
        var topCharsRaw = await _raceStatsRepository.GetTopCharactersByPlayerAsync(profileId, TopSetupCount, after, courseId);
        var topCharacters = topCharsRaw
            .Select(x => new SetupEntryDto(MarioKartMappings.GetCharacterName(x.Id), x.Count))
            .ToList();

        var topVehiclesRaw = await _raceStatsRepository.GetTopVehiclesByPlayerAsync(profileId, TopSetupCount, after, courseId);
        var topVehicles = topVehiclesRaw
            .Select(x => new SetupEntryDto(MarioKartMappings.GetVehicleName(x.Id), x.Count))
            .ToList();

        var topCombosRaw = await _raceStatsRepository.GetTopCombosByPlayerAsync(profileId, TopSetupCount, after, courseId);
        var topCombos = topCombosRaw
            .Select(x => new SetupEntryDto(
                $"{MarioKartMappings.GetCharacterName(x.CharacterId)} + {MarioKartMappings.GetVehicleName(x.VehicleId)}",
                x.Count))
            .ToList();

        // Frames in 1st
        var totalFramesIn1st = await _raceStatsRepository.GetTotalFramesIn1stByPlayerAsync(profileId, after, courseId);
        var avgFramesIn1st = totalRaces > 0 ? (double)totalFramesIn1st / totalRaces : 0;

        // Recent races (paginated)
        var (recentRaw, totalRecentCount) = await _raceStatsRepository.GetRecentRacesByPlayerAsync(
            profileId, page, pageSize, after, courseId);

        var recentCourseIds = recentRaw.Select(r => r.CourseId).Distinct().ToList();
        var recentTracks = await _trackRepository.GetTracksByCourseIdsAsync(recentCourseIds);
        var recentTrackMap = recentTracks
            .GroupBy(t => t.CourseId)
            .ToDictionary(g => g.Key, g => string.Join(" / ", g.Select(t => t.Name)));

        var recentRaces = recentRaw
            .Select(r => new RecentRaceDto(
                recentTrackMap.TryGetValue(r.CourseId, out var trackName) ? trackName : $"Course {r.CourseId}",
                r.CourseId,
                FormatFinishTime(r.FinishTime),
                MarioKartMappings.GetCharacterName(r.CharacterId),
                MarioKartMappings.GetVehicleName(r.VehicleId),
                r.RaceTimestamp))
            .ToList();

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

        // All played tracks
        var allTracksRaw = await _raceStatsRepository.GetAllPlayedTracksAsync(after);
        var trackIds = allTracksRaw.Select(t => t.CourseId).ToList();
        var tracks = await _trackRepository.GetTracksByCourseIdsAsync(trackIds);
        var trackNameMap = tracks
            .GroupBy(t => t.CourseId)
            .ToDictionary(g => g.Key, g => string.Join(" / ", g.Select(t => t.Name)));

        var allPlayedTracks = allTracksRaw
            .Select(t => new TrackPlayCountDto(
                trackNameMap.TryGetValue(t.CourseId, out var name) ? name : $"Course {t.CourseId}",
                t.Count,
                t.CourseId))
            .ToList();

        // Top characters, vehicles, combos
        var topCharsRaw = await _raceStatsRepository.GetTopCharactersAsync(TopSetupCount, after);
        var topCharacters = topCharsRaw
            .Select(x => new SetupEntryDto(MarioKartMappings.GetCharacterName(x.Id), x.Count))
            .ToList();

        var topVehiclesRaw = await _raceStatsRepository.GetTopVehiclesAsync(TopSetupCount, after);
        var topVehicles = topVehiclesRaw
            .Select(x => new SetupEntryDto(MarioKartMappings.GetVehicleName(x.Id), x.Count))
            .ToList();

        var topCombosRaw = await _raceStatsRepository.GetTopCombosAsync(TopSetupCount, after);
        var topCombos = topCombosRaw
            .Select(x => new SetupEntryDto(
                $"{MarioKartMappings.GetCharacterName(x.CharacterId)} + {MarioKartMappings.GetVehicleName(x.VehicleId)}",
                x.Count))
            .ToList();

        // Most active players
        var activePlayersRaw = await _raceStatsRepository.GetMostActivePlayersAsync(10, after);
        var activePids = activePlayersRaw.Select(x => x.ProfileId.ToString()).ToList();
        var activePlayers = await _playerRepository.GetPlayersByPidsAsync(activePids);
        var playerMap = activePlayers.ToDictionary(p => p.Pid, p => (p.Name, p.Fc));

        var mostActivePlayers = activePlayersRaw
            .Select(x =>
            {
                var (name, fc) = playerMap.TryGetValue(x.ProfileId.ToString(), out var info)
                    ? info
                    : ($"Player {x.ProfileId}", "");
                return new ActivePlayerDto(name, x.ProfileId.ToString(), fc, x.Count);
            })
            .ToList();

        // Activity by day — fill missing days with 0
        var dayRaw = await _raceStatsRepository.GetRaceCountByDayOfWeekAsync(after);
        var dayMap = dayRaw.ToDictionary(x => x.DayOfWeek, x => x.Count);
        var racesByDay = Enumerable.Range(0, 7)
            .Select(d => new DayActivityDto(DayNames[d], dayMap.TryGetValue(d, out var c) ? c : 0))
            .ToList();

        // Activity by hour — fill missing hours with 0
        var hourRaw = await _raceStatsRepository.GetRaceCountByHourAsync(after);
        var hourMap = hourRaw.ToDictionary(x => x.Hour, x => x.Count);
        var racesByHour = Enumerable.Range(0, 24)
            .Select(h => new HourActivityDto(h, hourMap.TryGetValue(h, out var c) ? c : 0))
            .ToList();

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

        // Race stats are optional — null if player has no race data
        var raceStats = await GetPlayerRaceStatsAsync(pid, null, null, 1, 20);

        return new PlayerStatsDto(
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
    }

    private static string FormatFinishTime(int rawValue)
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
