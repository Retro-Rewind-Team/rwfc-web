using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Services.External;

public interface IRetroWFCApiClient
{
    /// <summary>
    /// Asynchronously retrieves a list of groups that are currently active.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of active groups. The list
    /// will be empty if no groups are active.</returns>
    Task<List<Group>> GetActiveGroupsAsync(CancellationToken cancellationToken = default);
    /// <summary>
    /// Asynchronously retrieves race results for all races in the specified room.
    /// </summary>
    /// <param name="roomId">The unique identifier of the room for which race results are requested. Cannot be null or empty.</param>
    /// <param name="cancellationToken">Cancels the request. Caller cancellation propagates; transport failures still return an empty result.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a dictionary mapping race IDs to
    /// lists of race results. The dictionary will be empty if no races are found for the specified room.</returns>
    Task<Dictionary<int, List<RaceResult>>> GetRoomRaceResultsAsync(string roomId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Asynchronously retrieves the total connected player count from the Retro WFC API.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the player count, or null if the
    /// request failed.</returns>
    Task<int?> GetPlayerCountAsync(CancellationToken cancellationToken = default);
}
