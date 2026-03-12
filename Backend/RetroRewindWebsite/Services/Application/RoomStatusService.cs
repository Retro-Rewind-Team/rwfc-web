using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.DTOs.Room;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Services.External;
using System.Collections.Concurrent;

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
            Rooms: [.. snapshot.Rooms.Select(MapToRoomDto)],
            Timestamp: snapshot.Timestamp,
            Id: snapshot.Id,
            MinimumId: GetMinimumId(),
            MaximumId: GetMaximumId()
        );

    private static RoomDto MapToRoomDto(Group group)
    {
        var players = group.Players.Values.Select(MapToRoomPlayerDto).ToList();

        var playersWithVR = players.Where(p => p.VR is > 0).ToList();
        int? averageVR = playersWithVR.Count > 0
            ? (int)Math.Round(playersWithVR.Average(p => p.VR!.Value))
            : null;

        return new RoomDto(
            Id: group.Id,
            Type: group.Type,
            Created: group.Created,
            Host: group.Host,
            Rk: group.Rk,
            Players: players,
            AverageVR: averageVR,
            Race: group.Race != null
                ? new RaceDto(group.Race.Num, group.Race.Course, group.Race.Cc)
                : null,
            Suspend: group.Suspend
        );
    }

    private static RoomPlayerDto MapToRoomPlayerDto(ExternalPlayer player)
    {
        var connectionMap = string.IsNullOrEmpty(player.Conn_map)
            ? new List<string>()
            : [.. player.Conn_map.Select(c => c.ToString())];

        var mii = player.Mii?.FirstOrDefault() is { } firstMii
            ? new MiiDto(firstMii.Data, firstMii.Name)
            : null;

        return new RoomPlayerDto(
            Pid: player.Pid,
            Name: player.Name,
            FriendCode: player.Fc,
            VR: string.IsNullOrEmpty(player.Ev) ? null : player.VR,
            BR: string.IsNullOrEmpty(player.Eb) ? null : player.BR,
            IsOpenHost: player.IsOpenHost,
            IsSuspended: player.IsSuspended,
            Mii: mii,
            ConnectionMap: connectionMap
        );
    }

    private static string GetRoomType(string? rk) => rk switch
    {
        "vs_10" => "Retro Tracks",
        "vs_11" => "Online TT",
        "vs_12" => "200cc",
        "vs_13" => "Item Rain",
        "vs_14" => "Regular Battle",
        "bt_15" => "Elimination Battle",
        "vs_20" => "Custom Tracks",
        "vs_21" => "Vanilla Tracks",
        "vs_666" => "Luminous 150cc",
        "vs_667" => "Luminous Online TT",
        "vs_668" => "CTGP-C",
        "vs_669" => "CTGP-C Online TT",
        "vs_670" => "CTGP-C Placeholder",
        "vs_751" => "Versus",
        "vs_-1" or "vs" => "Regular",
        "vs_875" => "OptPack 150cc",
        "vs_876" => "OptPack Online TT",
        "vs_877" or "vs_878" or "vs_879" or "vs_880" => "OptPack",
        "vs_1312" => "WTP 150cc",
        "vs_1313" => "WTP 200cc",
        "vs_1314" => "WTP Online TT",
        "vs_1315" => "WTP Item Rain",
        "vs_1316" => "WTP STYD",
        _ => string.Empty
    };

    private class RoomStatusSnapshot
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public List<Group> Rooms { get; set; } = [];
    }
}
