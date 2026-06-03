using RetroRewindWebsite.Models.DTOs.Common;
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

        /// <summary>
        /// Returns aggregated analytics for a player: win rate, finish position distribution,
        /// track performance, and activity patterns. Returns null if the player does not exist
        /// or has no race data.
        /// </summary>
        Task<PlayerAnalyticsDto?> GetPlayerAnalyticsAsync(string pid, int? days, short? engineClassId);

        /// <summary>
        /// Returns a paginated list of races matching the given filters, with full participant details.
        /// </summary>
        Task<PagedResult<RaceResultDto>> GetRacesAsync(
            string? roomId,
            int? raceNumber,
            short? courseId,
            short? engineClassId,
            string? friendCode,
            DateTime? from,
            DateTime? to,
            int page,
            int pageSize);

        /// <summary>
        /// Returns a paged list of the fastest online race times per player for a given track,
        /// ordered fastest first. <paramref name="engineClassId"/> null means all cc classes.
        /// </summary>
        Task<TrackOnlineBestsResultDto> GetTrackOnlineBestsAsync(
            short courseId, short? engineClassId, int page, int pageSize);

        /// <summary>
        /// Returns the best online race time per track+cc for a given player.
        /// Returns <c>null</c> if the player does not exist.
        /// Returns an empty list if the player exists but has no recorded online times.
        /// </summary>
        Task<List<PlayerOnlineBestDto>?> GetPlayerOnlineBestsAsync(string pid);
    }
}
