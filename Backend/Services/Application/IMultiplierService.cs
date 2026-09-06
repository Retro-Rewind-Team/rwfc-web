using RetroRewindWebsite.Models.DTOs.Multiplier;

namespace RetroRewindWebsite.Services.Application;

public interface IMultiplierService
{
    /// <summary>
    /// Returns the value of the currently active multiplier for the given channel, or 1.0
    /// (no multiplier) if no scheduled range currently covers the requested time.
    /// </summary>
    Task<double> GetActiveValueAsync(string channel);

    /// <summary>
    /// Creates a new scheduled multiplier range. Returns a failure result if the channel is
    /// invalid, the range is malformed (start not before end), or it overlaps an existing range.
    /// </summary>
    Task<MultiplierResultDto> CreateAsync(CreateMultiplierRequest request);

    /// <summary>
    /// Lists all scheduled multiplier ranges, optionally filtered to a single channel.
    /// </summary>
    Task<MultiplierListResultDto> GetAllAsync(string? channel);

    /// <summary>
    /// Retrieves a single scheduled multiplier range by id, or null if it does not exist.
    /// </summary>
    Task<MultiplierDto?> GetByIdAsync(int id);

    /// <summary>
    /// Updates an existing scheduled multiplier range's value/time window. Returns a failure
    /// result if the id is unknown, the range is malformed, or it overlaps another existing range.
    /// </summary>
    Task<MultiplierResultDto> UpdateAsync(int id, UpdateMultiplierRequest request);

    /// <summary>
    /// Deletes a scheduled multiplier range by id.
    /// </summary>
    Task<MultiplierDeletionResultDto> DeleteAsync(int id);
}
