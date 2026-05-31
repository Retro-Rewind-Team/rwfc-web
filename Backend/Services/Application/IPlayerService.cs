using RetroRewindWebsite.Models.DTOs.Player;

namespace RetroRewindWebsite.Services.Application;

public interface IPlayerService
{
    /// <summary>
    /// Asynchronously retrieves player information for the specified player identifier.
    /// </summary>
    Task<PlayerDto?> GetPlayerAsync(string fc);

    /// <summary>
    /// Retrieves the player's VR history for the specified number of days.
    /// </summary>
    Task<VRHistoryRangeResponseDto?> GetPlayerHistoryAsync(string fc, int? days);

    /// <summary>
    /// Retrieves the player's VR history between two explicit UTC timestamps.
    /// </summary>
    Task<VRHistoryRangeResponseDto?> GetPlayerHistoryAsync(string fc, DateTime from, DateTime to);

    /// <summary>
    /// Retrieves a list of recent VR history records for the specified player asynchronously.
    /// </summary>
    Task<List<VRHistoryDto>?> GetPlayerRecentHistoryAsync(string fc, int count);

    /// <summary>
    /// Retrieves legacy player information associated with the specified friend code asynchronously.
    /// </summary>
    Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode);

    /// <summary>
    /// Retrieves the name and raw Mii binary for the specified player, for use by the Mii download endpoint only.
    /// Returns null if the player does not exist.
    /// </summary>
    Task<PlayerMiiDownloadDto?> GetPlayerMiiDownloadAsync(string fc);
}
