using RetroRewindWebsite.Models.DTOs.RaceStats;

namespace RetroRewindWebsite.Services.Application
{
    public interface IRaceStatsService
    {
        /// <summary>
        /// Returns paginated race statistics for a single player, optionally filtered by a time
        /// window and/or course. Returns <c>null</c> if the player does not exist or has no races.
        /// </summary>
        Task<PlayerRaceStatsDto?> GetPlayerRaceStatsAsync(
            string pid,
            int? days,
            short? courseId,
            short? engineClassId,
            int page,
            int pageSize);

        /// <summary>
        /// Returns aggregate race statistics across all players, optionally filtered to the last <paramref name="days"/> days.
        /// </summary>
        Task<GlobalRaceStatsDto> GetGlobalRaceStatsAsync(int? days);

        /// <summary>
        /// Returns the combined leaderboard profile and race stats for a player. Race stats inside
        /// the DTO will be <c>null</c> if the player has no recorded races.
        /// Returns <c>null</c> if the player does not exist.
        /// </summary>
        Task<PlayerStatsDto?> GetPlayerFullStatsAsync(string pid);
    }
}
