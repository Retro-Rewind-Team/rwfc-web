namespace RetroRewindWebsite.Services.Domain;

public interface IMaintenanceService
{
    /// <summary>
    /// Asynchronously updates the VR gain values for all players.
    /// </summary>
    /// <returns>A task that represents the asynchronous update operation.</returns>
    Task UpdateAllPlayerVRGainsAsync();
}
