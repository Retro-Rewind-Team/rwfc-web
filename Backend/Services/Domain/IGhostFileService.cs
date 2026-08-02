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
}
