using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.DTOs.Room;
using RetroRewindWebsite.Models.Entities.Room;
using RetroRewindWebsite.Repositories.Room;
using RetroRewindWebsite.Repositories.TimeTrial;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Services.External;
using System.Collections.Concurrent;

namespace RetroRewindWebsite.Services.Application;

/// <summary>
/// Fetches and caches live RWFC room snapshots, serves historical snapshot queries, and resolves Mii images for room players.
/// </summary>
public class RoomStatusService : IRoomStatusService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<RoomStatusService> _logger;

    // In-memory cache: only used for the live (latest) snapshot
    private readonly ConcurrentQueue<RoomStatusSnapshot> _liveCache = new();
    private readonly SemaphoreSlim _refreshLock = new(1, 1);

    // In-memory peak tracking, loaded from DB at startup, updated on each new peak
    private volatile int _peakPlayersToday;
    private volatile int _peakPlayersAllTime;
    private DateOnly _peakTodayDate; // only read/written under _refreshLock

    // Track names come from a full read of the Tracks table. The poll was doing that every 10
    // seconds, roughly 8,600 reads a day of a table that changes only when TrackSync runs.
    private Dictionary<short, string>? _trackNames;
    private DateTime _trackNamesLoadedAt;

    // Snapshot id bounds, reported by three endpoints on every request.
    private volatile int _cachedMinId;
    private volatile int _cachedMaxId;
    private DateTime _idBoundsLoadedAt;

    private const int LiveCacheSize = 1;
    private const int RefreshTimeoutSeconds = 5;
    private const int TrackNameCacheMinutes = 10;
    private const int IdBoundsCacheSeconds = 60;

    public RoomStatusService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<RoomStatusService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    // ===== LIVE STATUS =====

    public Task<RoomStatusResponseDto?> GetLatestStatusAsync()
    {
        var latest = _liveCache.LastOrDefault();
        if (latest == null)
        {
            _logger.LogWarning("No live snapshot available yet");
            return Task.FromResult<RoomStatusResponseDto?>(null);
        }

        return Task.FromResult<RoomStatusResponseDto?>(RoomMapper.ToResponseDto(latest.Rooms, latest.DbId, latest.Timestamp));
    }

    public Task<RoomStatusStatsDto> GetStatsAsync()
    {
        var latest = _liveCache.LastOrDefault();

        var totalPlayers = latest?.Rooms.Sum(r => r.Players.Count) ?? 0;
        var totalRooms = latest?.Rooms.Count ?? 0;
        var publicRooms = latest?.Rooms.Count(r => r.Type == "anybody") ?? 0;
        var lastUpdated = latest?.Timestamp ?? DateTime.UtcNow;

        return Task.FromResult(new RoomStatusStatsDto(
            TotalPlayers: totalPlayers,
            TotalRooms: totalRooms,
            PublicRooms: publicRooms,
            PrivateRooms: totalRooms - publicRooms,
            LastUpdated: lastUpdated,
            PeakPlayersToday: _peakPlayersToday,
            PeakPlayersAllTime: _peakPlayersAllTime
        ));
    }

    // ===== HISTORICAL STATUS (DB) =====

    public async Task<RoomStatusResponseDto?> GetStatusByDbIdAsync(int id)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var entity = await repository.GetByDbIdAsync(id);
        if (entity == null)
        {
            _logger.LogWarning("Snapshot with DB ID {Id} not found", id);
            return null;
        }

        return RoomMapper.ToResponseDto(entity);
    }

    public async Task<RoomStatusResponseDto?> GetNearestStatusAsync(DateTime timestamp)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var entity = await repository.GetNearestAsync(timestamp);
        return entity == null ? null : RoomMapper.ToResponseDto(entity);
    }

    public async Task<PagedResult<RoomSnapshotDto>> GetSnapshotHistoryAsync(int page, int pageSize)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var paged = await repository.GetPagedAsync(page, pageSize);
        return paged.Map(RoomMapper.ToSnapshotDto);
    }

    public async Task<List<RoomSnapshotDto>> GetSnapshotsByDateRangeAsync(DateTime from, DateTime to)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var snapshots = await repository.GetByDateRangeAsync(from, to);
        return [.. snapshots.Select(RoomMapper.ToSnapshotDto)];
    }

    public async Task<List<PlayerCountDataPointDto>> GetPlayerCountSeriesAsync(int? days)
    {
        var bucketSize = days switch
        {
            1 => TimeSpan.FromMinutes(10),
            7 => TimeSpan.FromHours(1),
            30 => TimeSpan.FromHours(4),
            _ => TimeSpan.FromHours(12)
        };

        var cutoff = days.HasValue ? DateTime.UtcNow.AddDays(-days.Value) : (DateTime?)null;

        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var raw = await repository.GetPlayerCountSeriesAsync(cutoff, bucketSize);

        return raw.Select(r => new PlayerCountDataPointDto(r.Bucket, r.MaxPlayers, r.MaxRooms)).ToList();
    }

    /// <summary>
    /// Three endpoints report these bounds on every request, and each used to run two queries in
    /// its own DI scope, taking a second connection from a pool of ten to answer two index scans.
    /// </summary>
    /// <remarks>
    /// The maximum does not rely on the TTL to stay current: this service writes the snapshots, so
    /// it advances the cached maximum itself the moment a write succeeds. The TTL is really for the
    /// minimum, which only moves when old snapshots are pruned, and as a first load after start-up.
    /// </remarks>
    public async Task<(int MinId, int MaxId)> GetSnapshotIdBoundsAsync()
    {
        if (DateTime.UtcNow - _idBoundsLoadedAt < TimeSpan.FromSeconds(IdBoundsCacheSeconds))
            return (_cachedMinId, _cachedMaxId);

        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();
        var (minId, maxId) = await repository.GetIdBoundsAsync();

        _cachedMinId = minId;

        // Never move the maximum backwards. A persist that landed while this query was in flight
        // would otherwise be undone by a snapshot of the table taken before it.
        if (maxId > _cachedMaxId)
            _cachedMaxId = maxId;

        _idBoundsLoadedAt = DateTime.UtcNow;

        return (_cachedMinId, _cachedMaxId);
    }

    // ===== MII DATA =====

    public async Task<byte[]?> GetMiiImageBytesAsync(string friendCode)
    {
        var latest = _liveCache.LastOrDefault();
        if (latest == null) return null;

        var miiData = FindMiiDataInRooms(latest.Rooms, friendCode);
        if (string.IsNullOrEmpty(miiData)) return null;

        using var scope = _serviceScopeFactory.CreateScope();
        var miiService = scope.ServiceProvider.GetRequiredService<IMiiService>();
        var base64 = await miiService.GetMiiImageAsync(friendCode, miiData);

        if (string.IsNullOrEmpty(base64)) return null;
        return Convert.FromBase64String(base64);
    }

    public async Task<Dictionary<string, string>> GetMiiImageBatchAsync(IReadOnlyList<string> friendCodes)
    {
        var latest = _liveCache.LastOrDefault();
        if (latest == null) return [];

        var miiDataLookup = BuildMiiDataLookup(latest.Rooms);

        var cleanFriendCodes = friendCodes
            .Where(fc => !string.IsNullOrWhiteSpace(fc))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Where(fc => miiDataLookup.ContainsKey(fc))
            .ToList();

        if (cleanFriendCodes.Count == 0) return [];

        using var scope = _serviceScopeFactory.CreateScope();
        var miiService = scope.ServiceProvider.GetRequiredService<IMiiService>();

        var tasks = cleanFriendCodes.Select(async fc =>
        {
            var miiImage = await miiService.GetMiiImageAsync(fc, miiDataLookup[fc]);
            return (FriendCode: fc, MiiImage: miiImage);
        });

        var results = await Task.WhenAll(tasks);

        return results
            .Where(r => !string.IsNullOrEmpty(r.MiiImage))
            .ToDictionary(r => r.FriendCode, r => r.MiiImage!);
    }

    // ===== REFRESH =====

    public async Task InitializePeaksAsync()
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var now = DateTime.UtcNow;
        _peakPlayersAllTime = await repository.GetPeakPlayerCountAsync();
        _peakPlayersToday = await repository.GetPeakPlayerCountAsync(since: now.Date);
        _peakTodayDate = DateOnly.FromDateTime(now);

        _logger.LogInformation(
            "Peak players initialized: Today={PeakToday}, AllTime={PeakAllTime}",
            _peakPlayersToday, _peakPlayersAllTime);
    }

    public async Task RefreshRoomDataAsync(bool persistSnapshot)
    {
        if (!await _refreshLock.WaitAsync(TimeSpan.FromSeconds(RefreshTimeoutSeconds)))
        {
            _logger.LogWarning("Refresh already in progress, skipping");
            return;
        }

        try
        {
            _logger.LogDebug("Fetching room data from Retro WFC API");

            using var scope = _serviceScopeFactory.CreateScope();
            var retroWFCApiClient = scope.ServiceProvider.GetRequiredService<IRetroWFCApiClient>();
            var snapshotRepository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();
            var trackRepository = scope.ServiceProvider.GetRequiredService<ITrackRepository>();

            var groups = await retroWFCApiClient.GetActiveGroupsAsync();
            var timestamp = DateTime.UtcNow;

            var trackNames = await GetTrackNamesAsync(trackRepository, timestamp);

            // Map to DTOs (track names resolved here)
            var roomDtos = groups.Select(g => RoomMapper.ToDto(g, trackNames)).ToList();
            var totalPlayers = roomDtos.Sum(r => r.Players.Count);

            // Reset daily peak on day rollover (under _refreshLock, so no contention with reads)
            var today = DateOnly.FromDateTime(timestamp);
            if (today != _peakTodayDate)
            {
                _peakPlayersToday = 0;
                _peakTodayDate = today;
            }

            // Always persist if a new peak is detected, regardless of the scheduled tick
            if (totalPlayers > _peakPlayersToday || totalPlayers > _peakPlayersAllTime)
                persistSnapshot = true;

            int? dbId = null;
            if (persistSnapshot)
            {
                dbId = await PersistSnapshotAsync(snapshotRepository, roomDtos, timestamp);

                // Only update in-memory peaks if the write actually succeeded.
                // If it failed (dbId is null), leave peaks unchanged so the next tick retries.
                if (dbId.HasValue)
                {
                    if (totalPlayers > _peakPlayersToday) _peakPlayersToday = totalPlayers;
                    if (totalPlayers > _peakPlayersAllTime) _peakPlayersAllTime = totalPlayers;

                    // We just created the newest snapshot, so the cached maximum is known here
                    // without going back to the database for it.
                    if (dbId.Value > _cachedMaxId) _cachedMaxId = dbId.Value;
                }
            }

            // On DB failure keep the previous DbId so the live cache doesn't advertise an invalid ID
            var resolvedDbId = dbId ?? _liveCache.LastOrDefault()?.DbId ?? 0;

            // Update live cache regardless of whether we persisted
            UpdateLiveCache(new RoomStatusSnapshot
            {
                DbId = resolvedDbId,
                Timestamp = timestamp,
                Rooms = roomDtos
            });

            _logger.LogDebug(
                "Room data refreshed. Persisted={Persisted}, DB ID: {DbId}, Rooms: {RoomCount}, Players: {TotalPlayers}",
                persistSnapshot, resolvedDbId, groups.Count, totalPlayers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing room data");
            // Only reached if something here throws. It is not the WFC-outage path: the API client
            // logs and returns an empty list rather than throwing, so an outage refreshes the cache
            // to zero rooms and can persist a zero snapshot. That is intended -- when the WFC API
            // is unreachable there is nothing to play on -- so this is not a last-known-good hold.
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    // ===== PRIVATE HELPERS =====

    private async Task<int?> PersistSnapshotAsync(
        IRoomSnapshotRepository repository,
        List<RoomDto> rooms,
        DateTime timestamp)
    {
        var totalPlayers = rooms.Sum(r => r.Players.Count);
        var publicRooms = rooms.Count(r => r.Type == "anybody");

        var entity = new RoomSnapshotEntity
        {
            Timestamp = timestamp,
            TotalPlayers = totalPlayers,
            TotalRooms = rooms.Count,
            PublicRooms = publicRooms,
            PrivateRooms = rooms.Count - publicRooms,
            Rooms = rooms.Select(RoomMapper.ToRoomData).ToList()
        };

        try
        {
            await repository.AddAsync(entity);
            return entity.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist room snapshot to database");
            return null;
        }
    }

    private void UpdateLiveCache(RoomStatusSnapshot snapshot)
    {
        _liveCache.Enqueue(snapshot);
        while (_liveCache.Count > LiveCacheSize)
            _liveCache.TryDequeue(out _);
    }

    private static string? FindMiiDataInRooms(List<RoomDto> rooms, string friendCode)
    {
        foreach (var room in rooms)
        {
            var player = room.Players.FirstOrDefault(p =>
                p.FriendCode.Equals(friendCode, StringComparison.OrdinalIgnoreCase));

            if (player?.Mii != null)
                return player.Mii.Data;
        }

        return null;
    }

    private static Dictionary<string, string> BuildMiiDataLookup(List<RoomDto> rooms)
    {
        var lookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var room in rooms)
        {
            foreach (var player in room.Players.Where(p => p.Mii != null))
            {
                if (!lookup.ContainsKey(player.FriendCode))
                    lookup[player.FriendCode] = player.Mii!.Data;
            }
        }

        return lookup;
    }

    private class RoomStatusSnapshot
    {
        public int DbId { get; set; }
        public DateTime Timestamp { get; set; }
        public List<RoomDto> Rooms { get; set; } = [];
    }

    /// <summary>
    /// The track name lookup, rebuilt at most once every <see cref="TrackNameCacheMinutes"/>
    /// minutes. A track name only changes when TrackSync runs, so the cost of the cache is a name
    /// being briefly stale in the room browser, against a full table read every poll.
    /// </summary>
    /// <remarks>
    /// Only ever called from RefreshRoomDataAsync, which holds _refreshLock for its whole body, so
    /// the two fields need no synchronisation of their own.
    /// </remarks>
    private async Task<Dictionary<short, string>> GetTrackNamesAsync(
        ITrackRepository trackRepository,
        DateTime now)
    {
        if (_trackNames != null && now - _trackNamesLoadedAt < TimeSpan.FromMinutes(TrackNameCacheMinutes))
            return _trackNames;

        var allTracks = await trackRepository.GetAllTracksAsync();

        // Grouped because two tracks can share a CourseId; the room browser shows both names.
        _trackNames = allTracks
            .GroupBy(t => t.CourseId)
            .ToDictionary(
                g => g.Key,
                g => string.Join(" / ", g.Select(t => t.Name))
            );
        _trackNamesLoadedAt = now;

        return _trackNames;
    }
}
