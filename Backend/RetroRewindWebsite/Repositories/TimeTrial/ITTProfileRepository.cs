using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public interface ITTProfileRepository : IRepository<TTProfileEntity>
{
    /// <summary>
    /// Asynchronously retrieves a profile entity that matches the specified display name.
    /// </summary>
    /// <param name="displayName">The display name of the profile to retrieve. Cannot be null or empty.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the profile entity if found;
    /// otherwise, null.</returns>
    Task<TTProfileEntity?> GetByNameAsync(string displayName);

    /// <summary>
    /// Asynchronously retrieves all profile entities.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of profile entities. The list
    /// will be empty if no profiles are found.</returns>
    Task<List<TTProfileEntity>> GetAllAsync();
}
