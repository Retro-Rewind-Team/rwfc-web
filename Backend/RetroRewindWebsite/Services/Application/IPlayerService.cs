using RetroRewindWebsite.Models.DTOs.Player;

namespace RetroRewindWebsite.Services.Application;

public interface IPlayerService
{
    /// <summary>
    /// Asynchronously retrieves player information for the specified player identifier.
    /// </summary>
    /// <param name="fc">The unique identifier of the player to retrieve. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a PlayerDto object with the player's
    /// information if found; otherwise, null.</returns>
    Task<PlayerDto?> GetPlayerAsync(string fc);

    /// <summary>
    /// Retrieves the player's VR history for the specified number of days.
    /// </summary>
    /// <param name="fc">The unique identifier of the player whose history is to be retrieved. Cannot be null or empty.</param>
    /// <param name="days">The number of days for which to retrieve history. If null, retrieves the full available history.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a VRHistoryRangeResponseDto with the
    /// player's history, or null if no history is found.</returns>
    Task<VRHistoryRangeResponseDto?> GetPlayerHistoryAsync(string fc, int? days);

    /// <summary>
    /// Retrieves a list of recent VR history records for the specified player asynchronously.
    /// </summary>
    /// <param name="fc">The unique identifier of the player whose history is to be retrieved. Cannot be null or empty.</param>
    /// <param name="count">The maximum number of history records to return. Must be greater than zero.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of VR history records for the
    /// player, or null if no records are found.</returns>
    Task<List<VRHistoryDto>?> GetPlayerRecentHistoryAsync(string fc, int count);

    /// <summary>
    /// Retrieves legacy player information associated with the specified friend code asynchronously.
    /// </summary>
    /// <param name="friendCode">The friend code used to identify the legacy player. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see cref="PlayerDto"/>
    /// representing the legacy player if found; otherwise, <see langword="null"/>.</returns>
    Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode);
}
