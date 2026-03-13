using RetroRewindWebsite.Models.DTOs.Room;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Services.External;
using System.Collections.Concurrent;
using RetroRewindWebsite.Mappers;

namespace RetroRewindWebsite.Services.Application;

public class RoomStatusService : IRoomStatusService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<RoomStatusService> _logger;
    private readonly ConcurrentQueue<RoomStatusSnapshot> _snapshots = new();
    private readonly SemaphoreSlim _refreshLock = new(1, 1);

    private const int MaxSnapshots = 60;
    private const int RefreshTimeoutSeconds = 5;
    private int _currentId = 0;

    public RoomStatusService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<RoomStatusService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public Task<RoomStatusResponseDto?> GetLatestStatusAsync()
    {
        var latest = _snapshots.LastOrDefault();
        if (latest == null)
        {
            _logger.LogWarning("No snapshots available");
            return Task.FromResult<RoomStatusResponseDto?>(null);
        }

        return Task.FromResult<RoomStatusResponseDto?>(CreateResponseDto(latest));
    }

    public Task<RoomStatusResponseDto?> GetStatusByIdAsync(int id)
    {
        var snapshot = _snapshots.FirstOrDefault(s => s.Id == id);
        if (snapshot == null)
        {
            _logger.LogWarning("Snapshot with ID {Id} not found", id);
            return Task.FromResult<RoomStatusResponseDto?>(null);
        }

        return Task.FromResult<RoomStatusResponseDto?>(CreateResponseDto(snapshot));
    }

    public int GetMinimumId() => _snapshots.FirstOrDefault()?.Id ?? 0;
    public int GetMaximumId() => _snapshots.LastOrDefault()?.Id ?? 0;

    public Task<RoomStatusStatsDto> GetStatsAsync()
    {
        var latest = _snapshots.LastOrDefault();

        if (latest == null)
            return Task.FromResult(new RoomStatusStatsDto(0, 0, 0, 0, DateTime.UtcNow));

        var totalPlayers = latest.Rooms.Sum(r => r.Players.Count);
        var publicRooms = latest.Rooms.Count(r => r.Type == "anybody");

        return Task.FromResult(new RoomStatusStatsDto(
            TotalPlayers: totalPlayers,
            TotalRooms: latest.Rooms.Count,
            PublicRooms: publicRooms,
            PrivateRooms: latest.Rooms.Count - publicRooms,
            LastUpdated: latest.Timestamp
        ));
    }

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
            var groups = await retroWFCApiClient.GetActiveGroupsAsync();
            var snapshotId = Interlocked.Increment(ref _currentId) - 1;

            EnqueueSnapshot(new RoomStatusSnapshot
            {
                Id = snapshotId,
                Timestamp = DateTime.UtcNow,
                Rooms = groups
            });

            _logger.LogDebug("Room data refreshed. Snapshot ID: {Id}, Rooms: {RoomCount}",
                snapshotId, groups.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing room data");

            EnqueueSnapshot(new RoomStatusSnapshot
            {
                Id = Interlocked.Increment(ref _currentId) - 1,
                Timestamp = DateTime.UtcNow,
                Rooms = []
            });
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    private void EnqueueSnapshot(RoomStatusSnapshot snapshot)
    {
        _snapshots.Enqueue(snapshot);
        while (_snapshots.Count > MaxSnapshots)
            _snapshots.TryDequeue(out _);
    }

    private RoomStatusResponseDto CreateResponseDto(RoomStatusSnapshot snapshot) =>
        new(
            Rooms: [.. snapshot.Rooms.Select(RoomMapper.ToDto)],
            Timestamp: snapshot.Timestamp,
            Id: snapshot.Id,
            MinimumId: GetMinimumId(),
            MaximumId: GetMaximumId()
        );

    private class RoomStatusSnapshot
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public List<Group> Rooms { get; set; } = [];
    }
}
