using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.DTOs.Room;
using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Mappers;

public static class RoomMapper
{
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
