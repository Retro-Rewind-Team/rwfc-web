using RetroRewindWebsite.Models.External;

namespace RetroRewindWebsite.Services.External
{
    public interface IRetroWFCApiClient
    {
        Task<List<Group>> GetActiveGroupsAsync();
        Task<Dictionary<int, List<RaceResult>>> GetRoomRaceResultsAsync(string roomId);
    }
}
