using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Services.External
{
    public interface IRetroWFCApiClient
    {
        Task<List<Group>> GetActiveGroupsAsync();
    }
}
