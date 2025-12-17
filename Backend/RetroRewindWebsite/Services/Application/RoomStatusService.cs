using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Services.External;
using System.Collections.Concurrent;

namespace RetroRewindWebsite.Services.Application
{
    public class RoomStatusService : IRoomStatusService
    {
        private readonly ISplitRoomDetector _splitRoomDetector;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<RoomStatusService> _logger;
        private readonly ConcurrentQueue<RoomStatusSnapshot> _snapshots = new();
        private readonly SemaphoreSlim _refreshLock = new(1, 1);
        private const int MaxSnapshots = 60;
        private int _currentId = 0;
        private readonly object _idLock = new();

        public RoomStatusService(
            IServiceScopeFactory serviceScopeFactory,
            ILogger<RoomStatusService> logger,
            ISplitRoomDetector splitRoomDetector)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
            _splitRoomDetector = splitRoomDetector;
        }

        public async Task<RoomStatusResponseDto?> GetLatestStatusAsync()
        {
            var latest = _snapshots.LastOrDefault();
            if (latest == null)
            {
                _logger.LogWarning("No snapshots available");
                return null;
            }

            return CreateResponseDto(latest);
        }

        public async Task<RoomStatusResponseDto?> GetStatusByIdAsync(int id)
        {
            var snapshot = _snapshots.FirstOrDefault(s => s.Id == id);
            if (snapshot == null)
            {
                _logger.LogWarning("Snapshot with ID {Id} not found", id);
                return null;
            }

            return CreateResponseDto(snapshot);
        }

        public int GetMinimumId()
        {
            var first = _snapshots.FirstOrDefault();
            return first?.Id ?? 0;
        }

        public int GetMaximumId()
        {
            var last = _snapshots.LastOrDefault();
            return last?.Id ?? 0;
        }

        public async Task<RoomStatusStatsDto> GetStatsAsync()
        {
            var latest = _snapshots.LastOrDefault();
            if (latest == null)
            {
                return new RoomStatusStatsDto
                {
                    TotalPlayers = 0,
                    TotalRooms = 0,
                    PublicRooms = 0,
                    PrivateRooms = 0,
                    LastUpdated = DateTime.UtcNow
                };
            }

            var totalPlayers = latest.Rooms.Sum(r => r.Players.Count);
            var publicRooms = latest.Rooms.Count(r => r.Type == "anybody");
            var privateRooms = latest.Rooms.Count - publicRooms;

            return new RoomStatusStatsDto
            {
                TotalPlayers = totalPlayers,
                TotalRooms = latest.Rooms.Count,
                PublicRooms = publicRooms,
                PrivateRooms = privateRooms,
                LastUpdated = latest.Timestamp
            };
        }

        public async Task RefreshRoomDataAsync()
        {
            if (!await _refreshLock.WaitAsync(TimeSpan.FromSeconds(5)))
            {
                _logger.LogWarning("Refresh already in progress, skipping");
                return;
            }

            try
            {
                _logger.LogDebug("Fetching room data from Retro WFC API");

                // Create a scope to get the scoped IRetroWFCApiClient
                using var scope = _serviceScopeFactory.CreateScope();
                var retroWFCApiClient = scope.ServiceProvider.GetRequiredService<IRetroWFCApiClient>();

                var groups = await retroWFCApiClient.GetActiveGroupsAsync();

                int snapshotId;
                lock (_idLock)
                {
                    snapshotId = _currentId++;
                }

                var snapshot = new RoomStatusSnapshot
                {
                    Id = snapshotId,
                    Timestamp = DateTime.UtcNow,
                    Rooms = groups
                };

                _snapshots.Enqueue(snapshot);

                // Remove old snapshots if we exceed the limit
                while (_snapshots.Count > MaxSnapshots)
                {
                    _snapshots.TryDequeue(out _);
                }

                _logger.LogDebug("Room data refreshed successfully. Snapshot ID: {Id}, Rooms: {RoomCount}",
                    snapshotId, groups.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing room data");

                // Store a null snapshot to indicate failure but maintain the timeline
                int snapshotId;
                lock (_idLock)
                {
                    snapshotId = _currentId++;
                }

                var failedSnapshot = new RoomStatusSnapshot
                {
                    Id = snapshotId,
                    Timestamp = DateTime.UtcNow,
                    Rooms = new List<Group>()
                };

                _snapshots.Enqueue(failedSnapshot);

                while (_snapshots.Count > MaxSnapshots)
                {
                    _snapshots.TryDequeue(out _);
                }
            }
            finally
            {
                _refreshLock.Release();
            }
        }

        private RoomStatusResponseDto CreateResponseDto(RoomStatusSnapshot snapshot)
        {
            var roomDtos = snapshot.Rooms.Select(MapToRoomDto).ToList();

            // Apply split room detection
            roomDtos = _splitRoomDetector.DetectAndSplitRooms(roomDtos);

            return new RoomStatusResponseDto
            {
                Rooms = roomDtos,
                Timestamp = snapshot.Timestamp,
                Id = snapshot.Id,
                MinimumId = GetMinimumId(),
                MaximumId = GetMaximumId()
            };
        }

        private RoomDto MapToRoomDto(Group group)
        {
            var players = group.Players.Values.Select(MapToRoomPlayerDto).ToList();

            // Calculate average VR
            int? averageVR = null;
            if (players.Count > 0)
            {
                var playersWithVR = players.Where(p => p.VR.HasValue && p.VR.Value > 0).ToList();
                if (playersWithVR.Count > 0)
                {
                    averageVR = (int)Math.Round(playersWithVR.Average(p => p.VR!.Value));
                }
            }

            return new RoomDto
            {
                Id = group.Id,
                Type = group.Type,
                Created = group.Created,
                Host = group.Host,
                Rk = group.Rk,
                Players = players,
                AverageVR = averageVR,
                Race = group.Race != null ? new RaceDto
                {
                    Num = group.Race.Num,
                    Course = group.Race.Course,
                    Cc = group.Race.Cc
                } : null
            };
        }

        private RoomPlayerDto MapToRoomPlayerDto(ExternalPlayer player)
        {
            var connectionMap = new List<string>();
            if (!string.IsNullOrEmpty(player.Conn_map))
            {
                connectionMap = [.. player.Conn_map.Select(c => c.ToString())];
            }

            return new RoomPlayerDto
            {
                Pid = player.Pid,
                Name = player.Name,
                FriendCode = player.Fc,
                VR = string.IsNullOrEmpty(player.Ev) ? null : player.VR,
                BR = string.IsNullOrEmpty(player.Eb) ? null : player.BR,
                IsOpenHost = player.IsOpenHost,
                IsSuspended = player.IsSuspended,
                ConnectionMap = connectionMap,
                Mii = player.Mii?.FirstOrDefault() != null ? new MiiDto
                {
                    Data = player.Mii[0].Data,
                    Name = player.Mii[0].Name
                } : null
            };
        }

        private class RoomStatusSnapshot
        {
            public int Id { get; set; }
            public DateTime Timestamp { get; set; }
            public List<Group> Rooms { get; set; } = new();
        }
    }
}