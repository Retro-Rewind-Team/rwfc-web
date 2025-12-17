using RetroRewindWebsite.Models.DTOs;

namespace RetroRewindWebsite.Services.Application
{
    public class SplitRoomDetector : ISplitRoomDetector
    {
        private readonly ILogger<SplitRoomDetector> _logger;

        public SplitRoomDetector(ILogger<SplitRoomDetector> logger)
        {
            _logger = logger;
        }

        public List<RoomDto> DetectAndSplitRooms(List<RoomDto> rooms)
        {
            var result = new List<RoomDto>();

            foreach (var room in rooms)
            {
                var splitRooms = DetectSplitInRoom(room);
                result.AddRange(splitRooms);
            }

            return result;
        }

        private List<RoomDto> DetectSplitInRoom(RoomDto room)
        {
            var players = room.Players.ToList();

            if (players.Count == 0)
            {
                return [room];
            }

            // If no connection map data, assume everyone is connected
            if (players.All(p => p.ConnectionMap == null || p.ConnectionMap.Count == 0))
            {
                _logger.LogInformation("Room {RoomId}: No connection map data, assuming all players connected", room.Id);
                room.IsSplit = false;
                return [room];
            }

            // Build connection graph
            var playerConnections = BuildConnectionGraph(players);

            // Find connected components using DFS
            var components = FindConnectedComponents(players, playerConnections);

            _logger.LogInformation("Room {RoomId}: Found {ComponentCount} component(s)",
                room.Id, components.Count);

            // If only one component, no split
            if (components.Count <= 1)
            {
                room.IsSplit = false;
                return [room];
            }

            // Create sub-rooms for each component
            var subRooms = new List<RoomDto>();
            var hostPid = room.Host;

            foreach (var (index, component) in components.Select((c, i) => (i, c)))
            {
                var subRoom = new RoomDto
                {
                    Id = room.Id,
                    Type = room.Type,
                    Created = room.Created,
                    Host = room.Host,
                    Rk = room.Rk,
                    Race = room.Race,
                    AverageVR = CalculateAverageVR(component),
                    Players = component,
                    // First sub-room (containing host) is not marked as split
                    IsSplit = !component.Any(p => p.Pid == hostPid),
                    ConnectedPlayerIds = [.. component.Select(p => p.Pid)]
                };

                subRooms.Add(subRoom);
            }

            // Sort so host's room comes first
            subRooms = [.. subRooms.OrderBy(r => r.IsSplit)];

            _logger.LogInformation(
                "Room {RoomId} split into {Count} sub-rooms",
                room.Id,
                subRooms.Count
            );

            return subRooms;
        }

        private static Dictionary<string, HashSet<string>> BuildConnectionGraph(List<RoomPlayerDto> players)
        {
            var graph = new Dictionary<string, HashSet<string>>();

            for (int i = 0; i < players.Count; i++)
            {
                var player = players[i];
                graph[player.Pid] = [];

                if (player.ConnectionMap == null || player.ConnectionMap.Count == 0)
                {
                    // If no connection map, assume connected to everyone
                    for (int j = 0; j < players.Count; j++)
                    {
                        if (i != j)
                        {
                            graph[player.Pid].Add(players[j].Pid);
                        }
                    }
                    continue;
                }

                // Get list of other players (excluding current player)
                var otherPlayers = new List<RoomPlayerDto>();
                for (int j = 0; j < players.Count; j++)
                {
                    if (i != j)
                    {
                        otherPlayers.Add(players[j]);
                    }
                }

                // Parse connection map
                for (int j = 0; j < player.ConnectionMap.Count && j < otherPlayers.Count; j++)
                {
                    var connectionStatus = player.ConnectionMap[j];

                    // "0" means no connection, anything else (typically "1") means connected
                    if (connectionStatus != "0")
                    {
                        var targetPlayer = otherPlayers[j];

                        // Verify two-way connection if target has connection map
                        if (targetPlayer.ConnectionMap != null && targetPlayer.ConnectionMap.Count > 0)
                        {
                            // Find our index in the target's perspective
                            var ourIndexInTarget = -1;
                            for (int k = 0; k < players.Count; k++)
                            {
                                if (k == players.IndexOf(targetPlayer))
                                {
                                    continue; // Skip the target itself
                                }
                                if (players[k].Pid == player.Pid)
                                {
                                    ourIndexInTarget = k < players.IndexOf(targetPlayer) ? k : k - 1;
                                    break;
                                }
                            }

                            // Check if target also sees us
                            if (ourIndexInTarget >= 0 &&
                                ourIndexInTarget < targetPlayer.ConnectionMap.Count &&
                                targetPlayer.ConnectionMap[ourIndexInTarget] != "0")
                            {
                                graph[player.Pid].Add(targetPlayer.Pid);
                            }
                        }
                        else
                        {
                            // Target has no connection map, assume connection is valid
                            graph[player.Pid].Add(targetPlayer.Pid);
                        }
                    }
                }
            }

            return graph;
        }

        private static List<List<RoomPlayerDto>> FindConnectedComponents(
            List<RoomPlayerDto> players,
            Dictionary<string, HashSet<string>> connections)
        {
            var visited = new HashSet<string>();
            var components = new List<List<RoomPlayerDto>>();
            var playersByPid = players.ToDictionary(p => p.Pid);

            foreach (var player in players)
            {
                if (visited.Contains(player.Pid))
                {
                    continue;
                }

                var component = new List<RoomPlayerDto>();
                DFS(player.Pid, connections, visited, component, playersByPid);
                components.Add(component);
            }

            return components;
        }

        private static void DFS(
            string pid,
            Dictionary<string, HashSet<string>> connections,
            HashSet<string> visited,
            List<RoomPlayerDto> component,
            Dictionary<string, RoomPlayerDto> playersByPid)
        {
            if (visited.Contains(pid))
            {
                return;
            }

            visited.Add(pid);
            if (playersByPid.TryGetValue(pid, out var player))
            {
                component.Add(player);
            }

            if (connections.TryGetValue(pid, out var connectedPids))
            {
                foreach (var connectedPid in connectedPids)
                {
                    DFS(connectedPid, connections, visited, component, playersByPid);
                }
            }
        }

        private static int? CalculateAverageVR(List<RoomPlayerDto> players)
        {
            var playersWithVR = players.Where(p => p.VR.HasValue && p.VR.Value > 0).ToList();
            if (playersWithVR.Count == 0)
            {
                return null;
            }

            return (int)Math.Round(playersWithVR.Average(p => p.VR!.Value));
        }
    }
}