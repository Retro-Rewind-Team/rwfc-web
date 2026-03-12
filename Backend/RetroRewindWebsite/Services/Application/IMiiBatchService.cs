namespace RetroRewindWebsite.Services.Application;

public interface IMiiBatchService
{
    Task<string?> GetPlayerMiiAsync(string fc);
    Task<Dictionary<string, string?>> GetPlayerMiisBatchAsync(List<string> friendCodes);
    Task<Dictionary<string, string?>> GetLegacyPlayerMiisBatchAsync(List<string> friendCodes);
}