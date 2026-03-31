using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.Services.Application;

public class LeaderboardSyncService : ILeaderboardSyncService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IVRHistoryRepository _vrHistoryRepository;
    private readonly IRetroWFCApiClient _apiClient;
    private readonly IPlayerValidationService _validationService;
    private readonly ILogger<LeaderboardSyncService> _logger;

    private static readonly HashSet<string> AllowedRoomTypes =
    [
        "vs_10", "vs_11", "vs_12", "vs_13",
        "vs_14", "vs_15", "vs_20", "vs_21"
    ];

    public LeaderboardSyncService(
        IPlayerRepository playerRepository,
        IVRHistoryRepository vrHistoryRepository,
        IRetroWFCApiClient apiClient,
        IPlayerValidationService validationService,
        ILogger<LeaderboardSyncService> logger)
    {
        _playerRepository = playerRepository;
        _vrHistoryRepository = vrHistoryRepository;
        _apiClient = apiClient;
        _validationService = validationService;
        _logger = logger;
    }

    public async Task RefreshFromApiAsync()
    {
        _logger.LogDebug("Starting API refresh...");

        try
        {
            var groups = await _apiClient.GetActiveGroupsAsync();
            var apiPlayers = ExtractPlayersFromGroups(groups);

            var uniqueApiPlayers = apiPlayers
                .GroupBy(p => p.Pid)
                .Select(g => g.First())
                .ToList();

            var updatedCount = 0;
            var newCount = 0;

            foreach (var apiPlayer in uniqueApiPlayers)
            {
                var existingPlayer = await _playerRepository.GetByPidAsync(apiPlayer.Pid);

                if (existingPlayer == null)
                {
                    var newPlayer = CreatePlayerEntity(apiPlayer);

                    if (_validationService.IsSuspiciousNewPlayer(newPlayer.Ev))
                    {
                        newPlayer.IsSuspicious = true;
                        newPlayer.FlagReason = "High initial VR";
                        _logger.LogWarning(
                            "New player flagged as suspicious: {Name} ({Pid}) with VR {VR}",
                            newPlayer.Name, newPlayer.Pid, newPlayer.Ev);
                    }

                    await _playerRepository.AddAsync(newPlayer);
                    newCount++;
                }
                else
                {
                    var previousVR = existingPlayer.Ev;
                    UpdateExistingPlayer(existingPlayer, apiPlayer);
                    await _playerRepository.UpdateAsync(existingPlayer);
                    updatedCount++;

                    if (existingPlayer.Ev != previousVR)
                        await TrackVRHistoryAsync(existingPlayer, previousVR);
                }
            }

            _logger.LogInformation("API refresh completed. New: {NewCount}, Updated: {UpdatedCount}",
                newCount, updatedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during API refresh");
            throw;
        }
    }

    public async Task RefreshRankingsAsync()
    {
        _logger.LogDebug("Refreshing player rankings...");

        try
        {
            await _playerRepository.UpdatePlayerRanksAsync();
            _logger.LogInformation("Player rankings refreshed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing rankings");
            throw;
        }
    }

    /// <summary>
    /// Updates the properties of an existing player entity based on data from an external player source.
    /// </summary>
    /// <remarks>This method synchronizes key fields such as name, friend code, and VR value. If the VR value
    /// changes, it checks for suspicious status updates. Mii data changes will invalidate cached images. The method
    /// also updates the timestamps for last seen and last updated.</remarks>
    /// <param name="existingPlayer">The player entity to update. Must not be null.</param>
    /// <param name="apiPlayer">The external player data used to update the existing player. Must not be null.</param>
    private void UpdateExistingPlayer(PlayerEntity existingPlayer, ExternalPlayer apiPlayer)
    {
        var previousVR = existingPlayer.Ev;

        if (existingPlayer.Name != apiPlayer.Name)
            existingPlayer.Name = apiPlayer.Name;

        if (existingPlayer.Fc != apiPlayer.Fc)
            existingPlayer.Fc = apiPlayer.Fc;

        if (existingPlayer.Ev != apiPlayer.VR)
        {
            existingPlayer.Ev = apiPlayer.VR;

            var update = _validationService.CheckSuspiciousStatus(existingPlayer, previousVR);
            if (update != null)
            {
                existingPlayer.IsSuspicious = update.IsSuspicious;
                existingPlayer.SuspiciousVRJumps = update.SuspiciousVRJumps;
                existingPlayer.FlagReason = update.FlagReason;
            }
        }

        var firstMii = apiPlayer.Mii?.FirstOrDefault();
        if (firstMii?.Data != null && existingPlayer.MiiData != firstMii.Data)
        {
            existingPlayer.MiiData = firstMii.Data;
            existingPlayer.MiiImageBase64 = null;
            existingPlayer.MiiImageFetchedAt = null;

            _logger.LogDebug("Mii data changed for {Name} ({FriendCode}), cached image invalidated",
                existingPlayer.Name, existingPlayer.Fc);
        }

        existingPlayer.LastSeen = DateTime.UtcNow;
        existingPlayer.LastUpdated = DateTime.UtcNow;
    }

    /// <summary>
    /// Records the player's VR history and updates their recent VR gain statistics asynchronously.
    /// </summary>
    /// <remarks>Updates the player's VR gain for the last 24 hours, week, and month after recording the VR
    /// change. If an error occurs during tracking, a warning is logged and the player's statistics may not be
    /// updated.</remarks>
    /// <param name="player">The player entity whose VR history is being tracked. Cannot be null.</param>
    /// <param name="previousVR">The previous VR value for the player, used to calculate the VR change.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    private async Task TrackVRHistoryAsync(PlayerEntity player, int previousVR)
    {
        try
        {
            await _vrHistoryRepository.AddAsync(new VRHistoryEntity
            {
                PlayerId = player.Pid,
                Fc = player.Fc,
                Date = DateTime.UtcNow,
                VRChange = player.Ev - previousVR,
                TotalVR = player.Ev
            });

            // TODO: Replace with single multi-period query
            player.VRGainLast24Hours = await _vrHistoryRepository
                .CalculateVRGainAsync(player.Pid, TimeSpan.FromDays(1));
            player.VRGainLastWeek = await _vrHistoryRepository
                .CalculateVRGainAsync(player.Pid, TimeSpan.FromDays(7));
            player.VRGainLastMonth = await _vrHistoryRepository
                .CalculateVRGainAsync(player.Pid, TimeSpan.FromDays(30));

            _logger.LogDebug("Tracked VR change for {Name} ({Pid}): {OldVR} -> {NewVR}",
                player.Name, player.Pid, previousVR, player.Ev);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to track VR history for player {Name} ({Pid})",
                player.Name, player.Pid);
        }
    }

    /// <summary>
    /// Extracts a list of external players from the specified groups, including only those players with a positive VR
    /// value and belonging to allowed room types.
    /// </summary>
    /// <remarks>Groups with a non-empty room type that is not allowed are skipped. Only players with a
    /// positive VR value are included in the result.</remarks>
    /// <param name="groups">A list of groups from which to extract external players. Only groups with allowed room types are considered.</param>
    /// <returns>A list of external players with a VR value greater than zero from the allowed groups. The list will be empty if
    /// no matching players are found.</returns>
    private static List<ExternalPlayer> ExtractPlayersFromGroups(List<Group> groups)
    {
        var players = new List<ExternalPlayer>();

        foreach (var group in groups)
        {
            if (!string.IsNullOrEmpty(group.Rk) && !AllowedRoomTypes.Contains(group.Rk))
                continue;

            foreach (var (_, player) in group.Players)
            {
                if (player.VR > 0)
                    players.Add(player);
            }
        }

        return players;
    }

    /// <summary>
    /// Creates a new player entity based on the provided external player data.
    /// </summary>
    /// <remarks>The returned entity is initialized with default values for certain fields, such as rank and
    /// VR gain statistics. The Mii data is extracted from the first available Mii entry, or set to an empty string if
    /// none are present.</remarks>
    /// <param name="apiPlayer">The external player information used to populate the player entity. Cannot be null.</param>
    /// <returns>A new instance of PlayerEntity initialized with data from the specified external player.</returns>
    private static PlayerEntity CreatePlayerEntity(ExternalPlayer apiPlayer)
    {
        var miiData = apiPlayer.Mii?.FirstOrDefault()?.Data ?? string.Empty;

        return new PlayerEntity
        {
            Pid = apiPlayer.Pid,
            Name = apiPlayer.Name,
            Fc = apiPlayer.Fc,
            Ev = apiPlayer.VR,
            MiiData = miiData,
            LastSeen = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            IsSuspicious = false,
            SuspiciousVRJumps = 0,
            Rank = int.MaxValue,
            VRGainLast24Hours = 0,
            VRGainLastWeek = 0,
            VRGainLastMonth = 0
        };
    }
}
