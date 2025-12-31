namespace RetroRewindWebsite.Services.Domain
{
    public interface IMaintenanceService
    {
        /// <summary>
        /// Update VR gain statistics for all players (daily maintenance task)
        /// </summary>
        Task UpdateAllPlayerVRGainsAsync();
    }
}