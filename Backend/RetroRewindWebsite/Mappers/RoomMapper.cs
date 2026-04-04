using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.DTOs.Room;
using RetroRewindWebsite.Models.Entities.Room;
using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Mappers;

/// <summary>
/// Maps WFC API room data and persisted snapshot entities to their DTO forms.
/// </summary>
public static class RoomMapper
{
    /// <summary>
    /// Maps a raw RWFC API <see cref="Group"/> to <see cref="RoomDto"/>, resolving the current
    /// course ID to a display name via <paramref name="trackNames"/>.
    /// </summary>
    public static RoomDto ToDto(Group group, Dictionary<short, string> trackNames)
    {
        var players = group.Players.Values.Select(ToPlayerDto).ToList();

        var playersWithVR = players.Where(p => p.VR is > 0).ToList();
        int? averageVR = playersWithVR.Count > 0
            ? (int)Math.Round(playersWithVR.Average(p => p.VR!.Value))
            : null;

        string? trackName = null;
        if (group.Race != null)
            trackNames.TryGetValue((short)group.Race.Course, out trackName);

        return new RoomDto(
            Id: group.Id,
            Type: group.Type,
            Created: group.Created,
            Host: group.Host ?? string.Empty,
            Rk: group.Rk,
            Players: players,
            AverageVR: averageVR,
            Race: group.Race != null
                ? new RaceDto(group.Race.Num, group.Race.Course, group.Race.Cc, trackName)
                : null,
            Suspend: group.Suspend
        );
    }

    /// <summary>
    /// Maps a persisted room snapshot entity to the response DTO served by history endpoints.
    /// Note: <c>MinimumId</c> and <c>MaximumId</c> are left at 0, callers populate them
    /// from separate min/max queries when needed.
    /// </summary>
    public static RoomStatusResponseDto ToResponseDto(RoomSnapshotEntity entity) =>
        new(
            Rooms: entity.Rooms.Select(ToRoomDto).ToList(),
            Timestamp: entity.Timestamp,
            Id: entity.Id,
            MinimumId: 0,
            MaximumId: 0
        );

    /// <summary>
    /// Maps a live-cache entry (room list + metadata) to the response DTO served by the
    /// current-status endpoint.
    /// </summary>
    public static RoomStatusResponseDto ToResponseDto(List<RoomDto> rooms, int id, DateTime timestamp) =>
        new(
            Rooms: rooms,
            Timestamp: timestamp,
            Id: id,
            MinimumId: 0,
            MaximumId: 0
        );

    /// <summary>
    /// Maps a room snapshot entity to the summary DTO used by the history list endpoint.
    /// </summary>
    public static RoomSnapshotDto ToSnapshotDto(RoomSnapshotEntity entity) =>
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

    /// <summary>
    /// Converts a <see cref="RoomDto"/> to its persisted entity representation.
    /// </summary>
    public static RoomData ToRoomData(RoomDto dto) =>
        new(
            Id: dto.Id,
            Type: dto.Type,
            Created: dto.Created,
            Host: dto.Host,
            Rk: dto.Rk,
            Players: dto.Players.Select(p => new RoomPlayerData(
                Pid: p.Pid,
                Name: p.Name,
                FriendCode: p.FriendCode,
                VR: p.VR,
                BR: p.BR,
                IsOpenHost: p.IsOpenHost,
                IsSuspended: p.IsSuspended,
                Mii: p.Mii != null ? new MiiData(p.Mii.Data, p.Mii.Name) : null,
                ConnectionMap: p.ConnectionMap
            )).ToList(),
            AverageVR: dto.AverageVR,
            Race: dto.Race != null ? new RaceData(dto.Race.Num, dto.Race.Course, dto.Race.Cc, dto.Race.TrackName) : null,
            Suspend: dto.Suspend
        );

    /// <summary>
    /// Converts a persisted <see cref="RoomData"/> back to its DTO representation for API responses.
    /// </summary>
    public static RoomDto ToRoomDto(RoomData data) =>
        new(
            Id: data.Id,
            Type: data.Type,
            Created: data.Created,
            Host: data.Host,
            Rk: data.Rk,
            Players: data.Players.Select(p => new RoomPlayerDto(
                Pid: p.Pid,
                Name: p.Name,
                FriendCode: p.FriendCode,
                VR: p.VR,
                BR: p.BR,
                IsOpenHost: p.IsOpenHost,
                IsSuspended: p.IsSuspended,
                Mii: p.Mii != null ? new MiiDto(p.Mii.Data, p.Mii.Name) : null,
                ConnectionMap: p.ConnectionMap
            )).ToList(),
            AverageVR: data.AverageVR,
            Race: data.Race != null ? new RaceDto(data.Race.Num, data.Race.Course, data.Race.Cc, data.Race.TrackName) : null,
            Suspend: data.Suspend
        );

    /// <summary>
    /// Maps an external WFC player to the room player DTO, normalising empty VR/BR strings to null.
    /// </summary>
    private static RoomPlayerDto ToPlayerDto(ExternalPlayer player)
    {
        List<string> connectionMap = string.IsNullOrEmpty(player.Conn_map)
            ? []
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
}
