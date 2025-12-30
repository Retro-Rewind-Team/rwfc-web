namespace RetroRewindWebsite.Services.Domain
{
    public interface IMiiService
    {
        Task<string?> GetMiiImageAsync(
            string friendCode,
            string miiData,
            CancellationToken cancellationToken = default);
    }
}
