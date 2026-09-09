namespace RetroRewindWebsite.Services.Domain;

public interface IMaintenanceService
{
    /// <summary>
    /// Asynchronously updates the VR gain values for all players.
    /// </summary>
    /// <returns>A task that represents the asynchronous update operation.</returns>
    Task UpdateAllPlayerVRGainsAsync();

    /// <summary>
    /// Recomputes kart/bike preference for every player. The sync already reclassifies the players
    /// it sees online each tick, so this exists to catch drift from anything that changes race
    /// results without the player being online -- moderation edits, swaps, and backfills.
    /// </summary>
    /// <returns>A task that represents the asynchronous update operation.</returns>
    Task UpdateAllPlayerVehiclePreferencesAsync();
}
