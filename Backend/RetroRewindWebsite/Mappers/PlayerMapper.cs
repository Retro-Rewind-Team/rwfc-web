using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Mappers;

public static class PlayerMapper
{
    public static PlayerDto ToDto(PlayerEntity entity) => new(
        Pid: entity.Pid,
        Name: entity.Name,
        FriendCode: entity.Fc,
        VR: entity.Ev,
        Rank: entity.Rank,
        LastSeen: entity.LastSeen,
        IsSuspicious: entity.IsSuspicious,
        VRStats: new VRStatsDto(
            entity.VRGainLast24Hours,
            entity.VRGainLastWeek,
            entity.VRGainLastMonth),
        MiiImageBase64: entity.MiiImageBase64,
        MiiData: entity.MiiData
    );

    public static PlayerDto ToDtoWithoutMii(PlayerEntity entity) => new(
        Pid: entity.Pid,
        Name: entity.Name,
        FriendCode: entity.Fc,
        VR: entity.Ev,
        Rank: entity.Rank,
        LastSeen: entity.LastSeen,
        IsSuspicious: entity.IsSuspicious,
        VRStats: new VRStatsDto(
            entity.VRGainLast24Hours,
            entity.VRGainLastWeek,
            entity.VRGainLastMonth),
        MiiImageBase64: null,
        MiiData: entity.MiiData
    );

    public static PlayerDto FromLegacy(LegacyPlayerEntity entity) => new(
        Pid: entity.Pid,
        Name: entity.Name,
        FriendCode: entity.Fc,
        VR: entity.Ev,
        Rank: entity.Rank,
        LastSeen: entity.SnapshotDate,
        IsSuspicious: entity.IsSuspicious,
        VRStats: new VRStatsDto(0, 0, 0),
        MiiImageBase64: entity.MiiImageBase64,
        MiiData: entity.MiiData
    );
}
