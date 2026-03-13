namespace RetroRewindWebsite.Services.Domain;

public interface IMiiService
{
    /// <summary>
    /// Asynchronously retrieves the URL of a Mii character image based on the specified friend code and Mii data.
    /// </summary>
    /// <param name="friendCode">The Nintendo friend code associated with the Mii character. Cannot be null or empty.</param>
    /// <param name="miiData">A string containing the Mii character's data used to generate the image. Cannot be null or empty.</param>
    /// <param name="cancellationToken">A cancellation token that can be used to cancel the operation.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a string with the URL of the
    /// generated Mii image, or null if the image could not be generated.</returns>
    Task<string?> GetMiiImageAsync(
        string friendCode,
        string miiData,
        CancellationToken cancellationToken = default);
}
