using RetroRewindWebsite.Models.DTOs.Player;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Mappers;

/// <summary>
/// Maps <see cref="PlayerEntity"/> and <see cref="LegacyPlayerEntity"/> to their DTO forms.
/// </summary>
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
        MiiImageBase64: entity.MiiCache?.MiiImageBase64
    );

    /// <summary>
    /// Maps a player entity to <see cref="PlayerDto"/> with <c>MiiImageBase64</c> stripped out (saves bandwidth on list endpoints).
    /// </summary>
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
        MiiImageBase64: null
    );

    /// <summary>
    /// Maps a legacy snapshot entity to <see cref="PlayerDto"/>. VR gains are zero because legacy leaderboard snapshots
    /// don't include VR history data
    /// </summary>
    public static PlayerDto FromLegacy(LegacyPlayerEntity entity) => new(
        Pid: entity.Pid,
        Name: entity.Name,
        FriendCode: entity.Fc,
        VR: entity.Ev,
        Rank: entity.Rank,
        LastSeen: entity.SnapshotDate,
        IsSuspicious: entity.IsSuspicious,
        VRStats: new VRStatsDto(0, 0, 0),
        MiiImageBase64: entity.MiiImageBase64
    );

    /// <summary>
    /// Maps a player entity to the lightweight <see cref="InGamePlayerDto"/> used by the in-game leaderboard.
    /// </summary>
    public static InGamePlayerDto ToInGameDto(PlayerEntity entity) => new(
        Name: entity.Name,
        FriendCode: entity.Fc,
        VR: entity.Ev,
        Rank: entity.Rank,
        MiiData: entity.MiiData
    );

    /// <summary>
    /// Maps a player entity to the moderation-focused <see cref="PlayerBasicDto"/> (no VR/Mii fields).
    /// </summary>
    public static PlayerBasicDto ToBasicDto(PlayerEntity entity) => new(
        Pid: entity.Pid,
        Name: entity.Name,
        FriendCode: entity.Fc,
        IsSuspicious: entity.IsSuspicious,
        SuspiciousVRJumps: entity.SuspiciousVRJumps,
        FlagReason: entity.FlagReason,
        UnflagReason: entity.UnflagReason
    );

    /// <summary>
    /// Maps a player entity to the minimal <see cref="PlayerMiiDownloadDto"/> used only by the Mii download endpoint.
    /// </summary>
    public static PlayerMiiDownloadDto ToMiiDownloadDto(PlayerEntity entity) =>
        new(entity.Name, entity.MiiData);

    /// <summary>
    /// Maps a VR history entity to its DTO.
    /// </summary>
    public static VRHistoryDto ToVRHistoryDto(VRHistoryEntity entity) =>
        new(entity.Date, entity.VRChange, entity.TotalVR);
}
