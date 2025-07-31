using System.Runtime.CompilerServices;
using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Models.Entities;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.Services.Application
{
    public class GroupsExManager : IGroupsExManager
    {
        private readonly IRetroWFCApiClient _apiClient;
        private readonly IPlayerRepository _playerRepository;
        private readonly ILogger<IGroupsExManager> _logger;
        private GroupsExResponseDto? _cachedResponse;
        private DateTime _cachedTimestamp = DateTime.MinValue;

        public GroupsExManager(
            IRetroWFCApiClient apiClient,
            IPlayerRepository playerRepository,
            ILogger<IGroupsExManager> logger)
        {
            _apiClient = apiClient;
            _playerRepository = playerRepository;
            _logger = logger;
        }

        public async Task<GroupsExResponseDto> GetGroupsExAsync()
        {
            if (_cachedResponse != null && _cachedTimestamp - DateTime.Now < new TimeSpan(0, minutes: 1, 0))
            {
                _logger.LogDebug("Returning cached exgroups ({})", _cachedTimestamp);
                return _cachedResponse;
            }

            List<Group> groups = await _apiClient.GetActiveGroupsAsync();

            GroupExDto[] groupsEx = new GroupExDto[groups.Count];
            for (int i = 0; i < groups.Count; i++)
            {
                Group g = groups[i];
                groupsEx[i] = new()
                {
                    ID = g.Id,
                    Game = g.Game,
                    Created = g.Created,
                    Type = g.Type,
                    Suspend = g.Suspend,
                    Host = g.Host,
                    RK = g.Rk,
                    Players = await ExternalPlayersToGroupPlayers(g.Players),
                };
            }

            GroupsExResponseDto ret = new()
            {
                Groups = groupsEx,
            };

            _cachedResponse = ret;
            _cachedTimestamp = DateTime.Now;

            return ret;
        }

        private async Task<Dictionary<string, GroupPlayerDto>> ExternalPlayersToGroupPlayers(
                Dictionary<string, ExternalPlayer> players)
        {
            Dictionary<string, GroupPlayerDto> ret = new();

            foreach ((string k, ExternalPlayer p) in players)
            {
                GroupPlayerDto playerEx = new()
                {
                    Count = p.Count,
                    Pid = p.Pid,
                    Name = p.Name,
                    Conn_map = p.Conn_map,
                    Conn_fail = p.Conn_fail,
                    Suspend = p.Suspend,
                    Fc = p.Fc,
                    Ev = p.Ev,
                    Eb = p.Eb,
                    Mii = p.Mii,
                    Openhost = p.Openhost,
                };

                PlayerEntity? lbPlayer = await _playerRepository.GetByPidAsync(playerEx.Pid);

                if (lbPlayer != null)
                {
                    playerEx.Rank = lbPlayer.Rank;
                    playerEx.ActiveRank = lbPlayer.ActiveRank;
                }

                ret[k] = playerEx;
            }

            return ret;
        }
    }
}
