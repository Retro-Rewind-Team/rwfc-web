using RetroRewindWebsite.Models.DTOs;

namespace RetroRewindWebsite.Services.Application
{
    public interface IGroupsExManager
    {
        Task<GroupsExResponseDto> GetGroupsExAsync();
    }
}
