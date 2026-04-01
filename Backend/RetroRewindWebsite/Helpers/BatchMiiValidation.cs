using RetroRewindWebsite.Models.DTOs.Player;

namespace RetroRewindWebsite.Helpers;

/// <summary>
/// Validates batch Mii request parameters shared by <c>LeaderboardController</c>
/// and <c>RoomStatusController</c>.
/// Returns <see langword="null"/> on success, or an error message string on failure,
/// callers pass the message to <c>BadRequest()</c>.
/// </summary>
public static class BatchMiiValidation
{
    /// <summary>Maximum number of friend codes allowed in a single batch request.</summary>
    public const int MaxBatchCount = 25;

    /// <summary>
    /// Returns an error message if <paramref name="request"/> is invalid, otherwise
    /// <see langword="null"/>.
    /// </summary>
    public static string? Validate(BatchMiiRequestDto request)
    {
        if (request.FriendCodes == null || request.FriendCodes.Count == 0)
            return "Friend codes list cannot be empty";

        if (request.FriendCodes.Count > MaxBatchCount)
            return $"Maximum {MaxBatchCount} friend codes allowed per batch request";

        return null;
    }
}
