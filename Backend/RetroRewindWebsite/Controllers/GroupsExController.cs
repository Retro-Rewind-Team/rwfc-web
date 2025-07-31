using Microsoft.AspNetCore.Mvc;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Controllers
{
    [ApiController]
    [Route("api/")]
    public class GroupsExController : ControllerBase
    {
        private readonly IGroupsExManager _groupsExManager;
        private readonly ILogger<GroupsExController> _logger;

        public GroupsExController(IGroupsExManager groupsExManager, ILogger<GroupsExController> logger)
        {
            _groupsExManager = groupsExManager;
            _logger = logger;
        }

        [HttpGet("groups")]
        public async Task<ActionResult<GroupsExResponseDto>> GetGroups()
        {
            try
            {
                return Ok(await _groupsExManager.GetGroupsExAsync());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting exgroups");
                return StatusCode(500, "An error occured while retrieving groups data");
            }
        }
    }
}
