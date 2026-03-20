using RetroRewindWebsite.Models.DTOs.RaceStats;

namespace RetroRewindWebsite.Services.Application
{
    public interface IRaceStatsService
    {
        Task<PlayerRaceStatsDto?> GetPlayerRaceStatsAsync(
            string pid,
            int? days,
            short? courseId,
            int page,
            int pageSize);

        Task<GlobalRaceStatsDto> GetGlobalRaceStatsAsync(int? days);

        Task<PlayerStatsDto?> GetPlayerFullStatsAsync(string pid);
    }
}
