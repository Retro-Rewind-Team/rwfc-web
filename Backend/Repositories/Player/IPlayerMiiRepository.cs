using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Repositories.Player;

public interface IPlayerMiiRepository
{
    /// <summary>
    /// Retrieves a list of players who require Mii images to be generated or updated.
    /// </summary>
    /// <param name="count">The maximum number of players to return. Must be a positive integer.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of players needing Mii
    /// images. The list may be empty if no players require Mii images.</returns>
    Task<List<PlayerEntity>> GetPlayersNeedingMiiImagesAsync(int count);

    /// <summary>
    /// Updates the Mii image for the specified player asynchronously.
    /// </summary>
    /// <param name="pid">The unique identifier of the player whose Mii image will be updated. Cannot be null or empty.</param>
    /// <param name="miiImageBase64">A base64-encoded string representing the new Mii image. Must be a valid base64 image string.</param>
    /// <returns>A task that represents the asynchronous operation. The task completes when the Mii image has been updated.</returns>
    Task UpdatePlayerMiiImageAsync(string pid, string miiImageBase64);

    /// <summary>
    /// Removes the cached Mii image for the specified player, e.g. when their Mii data changes.
    /// </summary>
    /// <param name="pid">The unique identifier of the player whose cache entry should be deleted.</param>
    Task InvalidatePlayerMiiCacheAsync(string pid);
}
