using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Repositories.TimeTrial;

namespace RetroRewindWebsite.Services.Application;

public class TimeTrialService : ITimeTrialService
{
    private readonly ITrackRepository _trackRepository;
    private readonly ITTProfileRepository _ttProfileRepository;
    private readonly IGhostSubmissionRepository _ghostSubmissionRepository;
    private readonly ILogger<TimeTrialService> _logger;

    private const short CC_150 = 150;
    private const short CC_200 = 200;

    public TimeTrialService(
        ITrackRepository trackRepository,
        ITTProfileRepository ttProfileRepository,
        IGhostSubmissionRepository ghostSubmissionRepository,
        ILogger<TimeTrialService> logger)
    {
        _trackRepository = trackRepository;
        _ttProfileRepository = ttProfileRepository;
        _ghostSubmissionRepository = ghostSubmissionRepository;
        _logger = logger;
    }

    // ===== TRACKS =====

    public async Task<List<TrackDto>> GetAllTracksAsync()
    {
        var tracks = await _trackRepository.GetAllTracksAsync();
        return tracks.Select(TrackMapper.ToDto).ToList();
    }

    public async Task<TrackDto?> GetTrackAsync(int id)
    {
        var track = await _trackRepository.GetByIdAsync(id);
        return track == null ? null : TrackMapper.ToDto(track);
    }

    // ===== LEADERBOARDS =====

    public async Task<TrackLeaderboardDto?> GetLeaderboardAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        string? vehicle,
        short? vehicleMin,
        short? vehicleMax,
        int page,
        int pageSize)
    {
        var track = await _trackRepository.GetByIdAsync(trackId);
        if (track == null)
            return null;

        var pagedResult = await _ghostSubmissionRepository.GetTrackLeaderboardAsync(
            trackId, cc, glitchAllowed, shroomless, vehicleMin, vehicleMax, page, pageSize);

        var flapMs = await _ghostSubmissionRepository.GetFastestLapForTrackAsync(
            trackId, cc, glitchAllowed, shroomless, vehicleMin, vehicleMax);

        var pageOffset = (page - 1) * pageSize;
        var submissions = GhostSubmissionMapper.ToLeaderboardDtos(pagedResult.Items, pageOffset);

        return new TrackLeaderboardDto(
            TrackMapper.ToDto(track),
            cc,
            glitchAllowed,
            shroomless,
            vehicle,
            IsFlap: false,
            [.. submissions.Cast<GhostSubmissionDto>()],
            pagedResult.TotalCount,
            pagedResult.CurrentPage,
            pagedResult.PageSize,
            pagedResult.TotalPages,
            flapMs,
            flapMs.HasValue ? GhostSubmissionMapper.FormatLapTime(flapMs.Value) : null
        );
    }

    public async Task<TrackLeaderboardDto?> GetFlapLeaderboardAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        string? vehicle,
        short? vehicleMin,
        short? vehicleMax,
        int page,
        int pageSize)
    {
        var track = await _trackRepository.GetByIdAsync(trackId);
        if (track == null)
            return null;

        var pagedResult = await _ghostSubmissionRepository.GetFlapLeaderboardAsync(
            trackId, cc, glitchAllowed, shroomless, vehicleMin, vehicleMax, page, pageSize);

        var pageOffset = (page - 1) * pageSize;
        var submissions = GhostSubmissionMapper.ToFlapLeaderboardDtos(pagedResult.Items, pageOffset);

        // Fastest flap is the min across the flap submissions on this page
        var flapMs = submissions.Count > 0 ? submissions.Min(s => s.FastestLapMs) : (int?)null;

        return new TrackLeaderboardDto(
            TrackMapper.ToDto(track),
            cc,
            glitchAllowed,
            shroomless,
            vehicle,
            IsFlap: true,
            [.. submissions.Cast<GhostSubmissionDto>()],
            pagedResult.TotalCount,
            pagedResult.CurrentPage,
            pagedResult.PageSize,
            pagedResult.TotalPages,
            flapMs,
            flapMs.HasValue ? GhostSubmissionMapper.FormatLapTime(flapMs.Value) : null
        );
    }

    public async Task<List<GhostSubmissionDto>> GetTopTimesAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax,
        int count)
    {
        var submissions = await _ghostSubmissionRepository.GetTopTimesForTrackAsync(
            trackId, cc, glitchAllowed, shroomless, vehicleMin, vehicleMax, count);

        return GhostSubmissionMapper.ToLeaderboardDtos(submissions, 0).Cast<GhostSubmissionDto>().ToList();
    }

    // ===== WORLD RECORDS =====

    public async Task<GhostSubmissionDto?> GetWorldRecordAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax)
    {
        var wr = await _ghostSubmissionRepository.GetWorldRecordAsync(
            trackId, cc, glitchAllowed, shroomless, vehicleMin, vehicleMax);

        return wr == null ? null : GhostSubmissionMapper.ToDto(wr, rank: 1);
    }

    public async Task<List<GhostSubmissionDto>> GetWorldRecordHistoryAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax)
    {
        var history = await _ghostSubmissionRepository.GetWorldRecordHistoryAsync(
            trackId, cc, glitchAllowed, shroomless, vehicleMin, vehicleMax);

        return history.Select(g => GhostSubmissionMapper.ToDto(g)).ToList<GhostSubmissionDto>();
    }

    public async Task<List<GhostSubmissionDto>> GetFlapWorldRecordHistoryAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax)
    {
        var history = await _ghostSubmissionRepository.GetFlapWorldRecordHistoryAsync(
            trackId, cc, glitchAllowed, shroomless, vehicleMin, vehicleMax);

        return history.Select(g => GhostSubmissionMapper.ToDto(g)).ToList<GhostSubmissionDto>();
    }

    public async Task<List<TrackWorldRecordsDto>> GetAllWorldRecordsAsync(
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax)
    {
        var tracks = await _trackRepository.GetAllTracksAsync();
        var wrByTrack = await _ghostSubmissionRepository.GetAllWorldRecordsAsync(
            cc, glitchAllowed, shroomless, vehicleMin, vehicleMax);

        return tracks.Select(track =>
        {
            wrByTrack.TryGetValue(track.Id, out var wr);
            return new TrackWorldRecordsDto(
                track.Id,
                track.Name,
                wr != null ? GhostSubmissionMapper.ToDto(wr, rank: 1) : null
            );
        }).ToList();
    }

    // ===== FLAP =====

    public async Task<FlapDto?> GetFastestLapAsync(
        int trackId,
        short cc,
        bool glitchAllowed,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax)
    {
        var flapMs = await _ghostSubmissionRepository.GetFastestLapForTrackAsync(
            trackId, cc, glitchAllowed, shroomless, vehicleMin, vehicleMax);

        return flapMs.HasValue
            ? new FlapDto(flapMs.Value, GhostSubmissionMapper.FormatLapTime(flapMs.Value))
            : null;
    }

    // ===== GHOST DOWNLOAD =====

    public async Task<(string FilePath, string FileName)?> GetGhostDownloadInfoAsync(int id)
    {
        var submission = await _ghostSubmissionRepository.GetByIdAsync(id);
        if (submission == null)
            return null;

        if (!File.Exists(submission.GhostFilePath))
        {
            _logger.LogWarning("Ghost file not found on disk: {FilePath}", submission.GhostFilePath);
            return null;
        }

        var fileName = $"{submission.FinishTimeDisplay.Replace(":", "m").Replace(".", "s")}.rkg";
        return (submission.GhostFilePath, fileName);
    }

    // ===== PROFILES =====

    public async Task<TTProfileDto?> GetProfileAsync(int ttProfileId)
    {
        var profile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
        return profile == null ? null : TTProfileMapper.ToDto(profile);
    }

    public async Task<PagedSubmissionsDto?> GetProfileSubmissionsAsync(
        int ttProfileId,
        int? trackId,
        short? cc,
        bool? glitch,
        bool? shroomless,
        short? vehicleMin,
        short? vehicleMax,
        int page,
        int pageSize)
    {
        var profile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
        if (profile == null)
            return null;

        var pagedResult = await _ghostSubmissionRepository.GetPlayerSubmissionsAsync(
            profile.Id, page, pageSize, trackId, cc, glitch, shroomless, vehicleMin, vehicleMax);

        var submissions = pagedResult.Items
            .Select(g => GhostSubmissionMapper.ToDto(g))
            .ToList<GhostSubmissionDto>();

        return new PagedSubmissionsDto(
            submissions,
            pagedResult.TotalCount,
            pagedResult.CurrentPage,
            pagedResult.PageSize,
            pagedResult.TotalPages
        );
    }

    public async Task<TTPlayerStatsDto?> GetPlayerStatsAsync(int ttProfileId)
    {
        var profile = await _ttProfileRepository.GetByIdAsync(ttProfileId);
        if (profile == null)
            return null;

        var tracks150 = await _ghostSubmissionRepository.CountDistinctTracksAsync(ttProfileId, CC_150);
        var tracks200 = await _ghostSubmissionRepository.CountDistinctTracksAsync(ttProfileId, CC_200);

        return new TTPlayerStatsDto(
            TTProfileMapper.ToDto(profile),
            await _ghostSubmissionRepository.CountDistinctTracksAsync(ttProfileId),
            tracks150,
            tracks200,
            await _ghostSubmissionRepository.CalculateAverageFinishPositionAsync(ttProfileId),
            await _ghostSubmissionRepository.CountTop10FinishesAsync(ttProfileId)
        );
    }
}
