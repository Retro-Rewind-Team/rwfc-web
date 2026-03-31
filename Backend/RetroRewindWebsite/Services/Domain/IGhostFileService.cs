using RetroRewindWebsite.Models.Domain;

namespace RetroRewindWebsite.Services.Domain;

public interface IGhostFileService
{
    /// <summary>
    /// Parses a Ghost file from the provided stream asynchronously and returns the result.
    /// </summary>
    /// <remarks>The caller is responsible for disposing the provided stream. This method does not modify the
    /// stream position.</remarks>
    /// <param name="fileStream">The stream containing the Ghost file data to parse. Must be readable and positioned at the start of the file
    /// content.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a <see cref="GhostFileParseResult"/>
    /// describing the outcome of the parsing operation.</returns>
    Task<GhostFileParseResult> ParseGhostFileAsync(Stream fileStream);

    /// <summary>
    /// Asynchronously saves a ghost file associated with a specific track and player.
    /// </summary>
    /// <param name="fileStream">The stream containing the ghost file data to be saved. Must be readable and positioned at the start of the file
    /// content.</param>
    /// <param name="trackId">The identifier of the track to which the ghost file will be linked.</param>
    /// <param name="cc">The course class value for the track. Specifies the difficulty or category of the track.</param>
    /// <param name="playerDisplayName">The display name of the player associated with the ghost file. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the unique identifier of the saved
    /// ghost file.</returns>
    Task<string> SaveGhostFileAsync(Stream fileStream, int trackId, short cc, string playerDisplayName);
}
