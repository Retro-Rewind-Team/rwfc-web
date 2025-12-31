namespace RetroRewindWebsite.Services.Domain
{
    public interface IMiiService
    {
        /// <summary>
        /// Get Mii image as base64 string for a player
        /// </summary>
        Task<string?> GetMiiImageAsync(
            string friendCode,
            string miiData,
            CancellationToken cancellationToken = default);
    }
}
