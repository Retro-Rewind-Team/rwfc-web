using RetroRewindWebsite.Models.DTOs.Common;
using RetroRewindWebsite.Models.Entities.Player;

namespace RetroRewindWebsite.Repositories.Player;

public interface ILegacyPlayerRepository
{
    /// <summary>
    /// Determines whether a legacy snapshot exists in the current context.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result is <see langword="true"/> if a legacy
    /// snapshot is present; otherwise, <see langword="false"/>.</returns>
    Task<bool> HasLegacySnapshotAsync();

    /// <summary>
    /// Retrieves a paged list of legacy leaderboard players, optionally filtered and sorted according to the specified
    /// criteria.
    /// </summary>
    Task<PagedResult<LegacyPlayerEntity>> GetLegacyLeaderboardPageAsync(int page, int pageSize, string? search, string sortBy, bool ascending);

    /// <summary>
    /// Asynchronously retrieves a legacy player entity associated with the specified friend code.
    /// </summary>
    Task<LegacyPlayerEntity?> GetLegacyPlayerByFriendCodeAsync(string friendCode);

    /// <summary>
    /// Asynchronously retrieves legacy player entities associated with the specified friend codes.
    /// </summary>
    Task<List<LegacyPlayerEntity>> GetLegacyPlayersByFriendCodesAsync(List<string> friendCodes);

    /// <summary>
    /// Asynchronously retrieves the total number of legacy players currently available.
    /// </summary>
    Task<int> GetLegacyPlayersCountAsync();

    /// <summary>
    /// Asynchronously retrieves the count of players flagged as suspicious using legacy detection criteria.
    /// </summary>
    Task<int> GetLegacySuspiciousPlayersCountAsync();
}
