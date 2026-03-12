using RetroRewindWebsite.Models.Domain;

namespace RetroRewindWebsite.Services.Domain;

public interface IGhostFileService
{
    Task<GhostFileParseResult> ParseGhostFileAsync(Stream fileStream);
    Task<string> SaveGhostFileAsync(Stream fileStream, int trackId, short cc, string playerDisplayName);
}
