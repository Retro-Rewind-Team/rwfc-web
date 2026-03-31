namespace RetroRewindWebsite.Services.Application;

public interface IMiiBatchService
{
    /// <summary>
    /// Retrieves the Mii data associated with the specified friend code asynchronously.
    /// </summary>
    /// <param name="fc">The friend code of the player whose Mii data is to be retrieved. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a string with the player's Mii data,
    /// or null if no data is found for the specified friend code.</returns>
    Task<string?> GetPlayerMiiAsync(string fc);

    /// <summary>
    /// Retrieves Mii avatar data for a batch of players identified by their friend codes.
    /// </summary>
    /// <remarks>The returned dictionary may include entries with null values if a player's Mii avatar data
    /// cannot be found. The operation is performed asynchronously and may involve network requests.</remarks>
    /// <param name="friendCodes">A list of friend codes representing the players whose Mii avatar data will be retrieved. Cannot be null or
    /// contain null values.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a dictionary mapping each friend
    /// code to its corresponding Mii avatar data as a string, or null if no data is available for that code.</returns>
    Task<Dictionary<string, string?>> GetPlayerMiisBatchAsync(List<string> friendCodes);

    /// <summary>
    /// Retrieves Mii data for a batch of legacy players identified by their friend codes.
    /// </summary>
    /// <remarks>The returned dictionary may include entries with null values if Mii data is not found for a
    /// given friend code. The operation is performed asynchronously and may involve network access.</remarks>
    /// <param name="friendCodes">A list of friend codes representing the players whose Mii data will be retrieved. Cannot be null or contain null
    /// values.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a dictionary mapping each friend
    /// code to its corresponding Mii data as a string, or null if no data is available for that code.</returns>
    Task<Dictionary<string, string?>> GetLegacyPlayerMiisBatchAsync(List<string> friendCodes);
}
