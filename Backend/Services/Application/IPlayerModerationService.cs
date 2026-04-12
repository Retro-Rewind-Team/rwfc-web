using RetroRewindWebsite.Models.DTOs.Player;

namespace RetroRewindWebsite.Services.Application;

/// <summary>
/// Handles player moderation operations: flagging, unflagging, banning, and VR jump analysis.
/// </summary>
public interface IPlayerModerationService
{
    /// <summary>
    /// Flags a player as suspicious with a reason.
    /// </summary>
    /// <param name="pid">The player's unique identifier.</param>
    /// <param name="reason">The reason for flagging.</param>
    /// <returns>The moderation result, or <see langword="null"/> if no player with the given PID exists.</returns>
    Task<ModerationActionResultDto?> FlagPlayerAsync(string pid, string reason);

    /// <summary>
    /// Removes the suspicious flag from a player, resetting their jump counter.
    /// </summary>
    /// <param name="pid">The player's unique identifier.</param>
    /// <param name="reason">The reason for unflagging.</param>
    /// <returns>The moderation result, or <see langword="null"/> if no player with the given PID exists.</returns>
    Task<ModerationActionResultDto?> UnflagPlayerAsync(string pid, string reason);

    /// <summary>
    /// Removes a player from the leaderboard.
    /// </summary>
    /// <param name="pid">The player's unique identifier.</param>
    /// <returns>The moderation result, or <see langword="null"/> if no player with the given PID exists.</returns>
    Task<ModerationActionResultDto?> BanPlayerAsync(string pid);

    /// <summary>
    /// Retrieves all VR history entries for a player where the absolute VR change exceeds the
    /// suspicious jump threshold, ordered most-recent first.
    /// </summary>
    /// <remarks>Also includes flag/unflag reason</remarks>
    /// <param name="pid">The player's unique identifier.</param>
    /// <returns>The result containing the player info and suspicious jump list,
    /// or <see langword="null"/> if no player with the given PID exists.</returns>
    Task<SuspiciousJumpsResultDto?> GetSuspiciousJumpsAsync(string pid);

    /// <summary>
    /// Atomically swaps all tracked stats between two player licenses: VR, VR history,
    /// race results, and moderation flags. Neither side loses data — A ends up with B's
    /// stats and B ends up with A's. Hardware-bound fields (PID, FC, name, Mii) are not touched.
    /// </summary>
    /// <param name="sourcePid">The PID of the first player.</param>
    /// <param name="targetPid">The PID of the second player.</param>
    /// <param name="reason">The moderator's reason for performing the swap.</param>
    /// <returns>The result containing both players after the swap,
    /// or <see langword="null"/> if either PID does not exist.</returns>
    Task<SwapResultDto?> SwapPlayerStatsAsync(string sourcePid, string targetPid, string reason);
}
