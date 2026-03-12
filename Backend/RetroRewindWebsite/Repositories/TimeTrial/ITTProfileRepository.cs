using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Repositories.Common;

namespace RetroRewindWebsite.Repositories.TimeTrial;

public interface ITTProfileRepository : IRepository<TTProfileEntity>
{
    Task<TTProfileEntity?> GetByNameAsync(string displayName);
    Task<List<TTProfileEntity>> GetAllAsync();
    Task UpdateWorldRecordCountsAsync();
}
