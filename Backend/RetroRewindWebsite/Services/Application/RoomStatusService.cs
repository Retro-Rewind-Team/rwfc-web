using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.DTOs.Room;
using RetroRewindWebsite.Models.Entities.Room;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories.Room;
using RetroRewindWebsite.Repositories.TimeTrial;
using RetroRewindWebsite.Services.External;
using System.Collections.Concurrent;

namespace RetroRewindWebsite.Services.Application;

public class RoomStatusService : IRoomStatusService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<RoomStatusService> _logger;

    // In-memory cache: only used for the live (latest) snapshot
    private readonly ConcurrentQueue<RoomStatusSnapshot> _liveCache = new();
    private readonly SemaphoreSlim _refreshLock = new(1, 1);

    private const int LiveCacheSize = 1;
    private const int RefreshTimeoutSeconds = 5;

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

        return Task.FromResult<RoomStatusResponseDto?>(ToResponseDto(latest.Rooms, latest.DbId, latest.Timestamp));
    }

    public async Task<RoomStatusStatsDto> GetStatsAsync()
    {
        var latest = _liveCache.LastOrDefault();

        var totalPlayers = latest?.Rooms.Sum(r => r.Players.Count) ?? 0;
        var publicRooms = latest?.Rooms.Count(r => r.Type == "anybody") ?? 0;
        var totalRooms = latest?.Rooms.Count ?? 0;
        var lastUpdated = latest?.Timestamp ?? DateTime.UtcNow;

        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var today = DateTime.UtcNow.Date;
        var peakToday = await repository.GetPeakPlayerCountAsync(since: today);
        var peakAllTime = await repository.GetPeakPlayerCountAsync();

        return new RoomStatusStatsDto(
            TotalPlayers: totalPlayers,
            TotalRooms: totalRooms,
            PublicRooms: publicRooms,
            PrivateRooms: totalRooms - publicRooms,
            LastUpdated: lastUpdated,
            PeakPlayersToday: peakToday,
            PeakPlayersAllTime: peakAllTime
        );
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

        return EntityToResponseDto(entity);
    }

    public async Task<RoomStatusResponseDto?> GetNearestStatusAsync(DateTime timestamp)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var entity = await repository.GetNearestAsync(timestamp);
        return entity == null ? null : EntityToResponseDto(entity);
    }

    public async Task<RoomSnapshotDto?> GetNearestSnapshotAsync(DateTime timestamp)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var entity = await repository.GetNearestAsync(timestamp);
        return entity == null ? null : MapSnapshotToDto(entity);
    }

    public async Task<PagedResult<RoomSnapshotDto>> GetSnapshotHistoryAsync(int page, int pageSize)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var paged = await repository.GetPagedAsync(page, pageSize);
        return paged.Map(MapSnapshotToDto);
    }

    public async Task<List<RoomSnapshotDto>> GetSnapshotsByDateRangeAsync(DateTime from, DateTime to)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();

        var snapshots = await repository.GetByDateRangeAsync(from, to);
        return [.. snapshots.Select(MapSnapshotToDto)];
    }

    public async Task<int> GetMinIdAsync()
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();
        return await repository.GetMinIdAsync();
    }

    public async Task<int> GetMaxIdAsync()
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IRoomSnapshotRepository>();
        return await repository.GetMaxIdAsync();
    }

    // ===== REFRESH =====

    public async Task RefreshRoomDataAsync()
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

            // Build track name lookup once — reused for both mapping and persistence
            var allTracks = await trackRepository.GetAllTracksAsync();
            var trackNames = allTracks
                .GroupBy(t => t.CourseId)
                .ToDictionary(
                    g => g.Key,
                    g => string.Join(" / ", g.Select(t => t.Name))
                );

            // Map to DTOs (track names resolved here)
            var roomDtos = groups.Select(g => RoomMapper.ToDto(g, trackNames)).ToList();

            // Persist to DB, this is the source of truth for all history
            var dbId = await PersistSnapshotAsync(snapshotRepository, roomDtos, timestamp);

            // Update live cache with DB ID so the controller can reference it
            UpdateLiveCache(new RoomStatusSnapshot
            {
                DbId = dbId,
                Timestamp = timestamp,
                Rooms = roomDtos
            });

            _logger.LogDebug("Room data refreshed. DB ID: {DbId}, Rooms: {RoomCount}",
                dbId, groups.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing room data");

            // Keep live cache entry with empty rooms so the endpoint doesn't return null
            UpdateLiveCache(new RoomStatusSnapshot
            {
                DbId = 0,
                Timestamp = DateTime.UtcNow,
                Rooms = []
            });
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    // ===== PRIVATE HELPERS =====

    private async Task<int> PersistSnapshotAsync(
        IRoomSnapshotRepository repository,
        List<RoomDto> rooms,
        DateTime timestamp)
    {
        try
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
                Rooms = rooms
            };

            await repository.AddAsync(entity);
            return entity.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist room snapshot to database");
            return 0;
        }
    }

    private void UpdateLiveCache(RoomStatusSnapshot snapshot)
    {
        _liveCache.Enqueue(snapshot);
        while (_liveCache.Count > LiveCacheSize)
            _liveCache.TryDequeue(out _);
    }

    private static RoomStatusResponseDto EntityToResponseDto(RoomSnapshotEntity entity) =>
        new(
            Rooms: entity.Rooms,
            Timestamp: entity.Timestamp,
            Id: entity.Id,
            MinimumId: 0, // populated by controller from GetMinIdAsync/GetMaxIdAsync
            MaximumId: 0
        );

    private static RoomStatusResponseDto ToResponseDto(List<RoomDto> rooms, int id, DateTime timestamp) =>
        new(
            Rooms: rooms,
            Timestamp: timestamp,
            Id: id,
            MinimumId: 0,
            MaximumId: 0
        );

    private static RoomSnapshotDto MapSnapshotToDto(RoomSnapshotEntity entity) =>
        new(
            Id: entity.Id,
            Timestamp: entity.Timestamp,
            TotalPlayers: entity.TotalPlayers,
            TotalRooms: entity.TotalRooms,
            PublicRooms: entity.PublicRooms,
            PrivateRooms: entity.PrivateRooms,
            Rooms: [.. entity.Rooms.Select(r => new RoomSnapshotRoomDto(
                RoomId: r.Id,
                Type: r.Type,
                Rk: r.Rk,
                PlayerCount: r.Players.Count,
                CourseId: r.Race?.Course,
                TrackName: r.Race?.TrackName,
                TrackId: null
            ))]
        );

    private class RoomStatusSnapshot
    {
        public int DbId { get; set; }
        public DateTime Timestamp { get; set; }
        public List<RoomDto> Rooms { get; set; } = [];
    }
}
