using RetroRewindWebsite.Models.Entities.Multiplier;

namespace RetroRewindWebsite.Repositories.Multiplier;

public interface IMultiplierRepository
{
    /// <summary>
    /// Adds a new scheduled multiplier range and persists it.
    /// </summary>
    Task<MultiplierEntity> CreateAsync(MultiplierEntity multiplier);

    /// <summary>
    /// Retrieves a scheduled multiplier range by its database identifier, or null if it does not exist.
    /// </summary>
    Task<MultiplierEntity?> GetByIdAsync(int id);

    /// <summary>
    /// Retrieves all scheduled multiplier ranges, optionally filtered to a single channel, ordered by start time.
    /// </summary>
    Task<List<MultiplierEntity>> GetAllAsync(MultiplierChannel? channel = null);

    /// <summary>
    /// Persists changes to an existing scheduled multiplier range.
    /// </summary>
    Task UpdateAsync(MultiplierEntity multiplier);

    /// <summary>
    /// Deletes the scheduled multiplier range with the given id. Returns false if it did not exist.
    /// </summary>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Retrieves the scheduled multiplier range for the given channel whose [StartTime, EndTime) window
    /// covers <paramref name="at"/>, or null if no range is currently active.
    /// </summary>
    Task<MultiplierEntity?> GetActiveAsync(MultiplierChannel channel, DateTime at);

    /// <summary>
    /// Retrieves all scheduled ranges for the given channel that overlap [<paramref name="start"/>, <paramref name="end"/>),
    /// optionally excluding a specific entry (used when validating an update against itself).
    /// </summary>
    Task<List<MultiplierEntity>> GetOverlappingAsync(MultiplierChannel channel, DateTime start, DateTime end, int? excludeId = null);
}
