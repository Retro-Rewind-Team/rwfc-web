using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.Services.Application;

public class LeaderboardSyncService : ILeaderboardSyncService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IPlayerMiiRepository _playerMiiRepository;
    private readonly IVRHistoryRepository _vrHistoryRepository;
    private readonly IRetroWFCApiClient _apiClient;
    private readonly IPlayerValidationService _validationService;
    private readonly IDiscordWebhookService _discordWebhook;
    private readonly ILogger<LeaderboardSyncService> _logger;

    private static readonly HashSet<string> AllowedRoomTypes =
    [
        "vs_10", "vs_11", "vs_12", "vs_13",
        "vs_14", "vs_15", "vs_20", "vs_21",
        "vs_22", "vs_751", "vs_-1", "vs"
    ];

    public LeaderboardSyncService(
        IPlayerRepository playerRepository,
        IPlayerMiiRepository playerMiiRepository,
        IVRHistoryRepository vrHistoryRepository,
        IRetroWFCApiClient apiClient,
        IPlayerValidationService validationService,
        IDiscordWebhookService discordWebhook,
        ILogger<LeaderboardSyncService> logger)
    {
        _playerRepository = playerRepository;
        _playerMiiRepository = playerMiiRepository;
        _vrHistoryRepository = vrHistoryRepository;
        _apiClient = apiClient;
        _validationService = validationService;
        _discordWebhook = discordWebhook;
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

            if (uniqueApiPlayers.Count == 0)
            {
                _logger.LogInformation("API refresh completed. No active players found.");
                return;
            }

            // Batch-fetch all existing players in one query instead of N individual lookups
            var allPids = uniqueApiPlayers.Select(p => p.Pid).ToList();
            var existingPlayers = await _playerRepository.GetPlayersByPidsAsync(allPids);
            var existingByPid = existingPlayers.ToDictionary(p => p.Pid);

            var toInsert = new List<PlayerEntity>();
            var toUpdate = new List<PlayerEntity>();
            var vrHistoryEntries = new List<VRHistoryEntity>();
            // pid → previousVR, for gain recalculation after batch insert of history
            var vrChangedPlayers = new List<(PlayerEntity Player, int PreviousVR)>();
            var miiInvalidations = new List<string>();

            var now = DateTime.UtcNow;

            foreach (var apiPlayer in uniqueApiPlayers)
            {
                if (!existingByPid.TryGetValue(apiPlayer.Pid, out var existingPlayer))
                {
                    var newPlayer = CreatePlayerEntity(apiPlayer);

                    if (_validationService.IsSuspiciousNewPlayer(newPlayer.Ev))
                    {
                        newPlayer.IsSuspicious = true;
                        newPlayer.FlagReason = "High initial VR";
                        _logger.LogWarning(
                            "New player flagged as suspicious: {Name} ({Pid}) with VR {VR}",
                            newPlayer.Name, newPlayer.Pid, newPlayer.Ev);
                        await _discordWebhook.SendAutoFlagAsync(newPlayer.Name, newPlayer.Fc, newPlayer.FlagReason);
                    }

                    toInsert.Add(newPlayer);
                }
                else
                {
                    var previousVR = existingPlayer.Ev;
                    var miiDataChanged = await UpdateExistingPlayer(existingPlayer, apiPlayer, now);
                    toUpdate.Add(existingPlayer);

                    if (miiDataChanged)
                        miiInvalidations.Add(existingPlayer.Pid);

                    if (existingPlayer.Ev != previousVR)
                    {
                        vrHistoryEntries.Add(new VRHistoryEntity
                        {
                            PlayerId = existingPlayer.Pid,
                            Fc = existingPlayer.Fc,
                            Date = now,
                            VRChange = existingPlayer.Ev - previousVR,
                            TotalVR = existingPlayer.Ev
                        });
                        vrChangedPlayers.Add((existingPlayer, previousVR));
                    }
                }
            }

            // Bulk insert/update players, two round-trips instead of N
            if (toInsert.Count > 0)
                await _playerRepository.AddRangeAsync(toInsert);

            if (toUpdate.Count > 0)
                await _playerRepository.UpdateRangeAsync(toUpdate);

            // Batch insert VR history entries
            if (vrHistoryEntries.Count > 0)
                await _vrHistoryRepository.AddRangeAsync(vrHistoryEntries);

            // Per-player gain recalculation (bounded to players whose VR actually changed)
            foreach (var (player, _) in vrChangedPlayers)
            {
                try
                {
                    (player.VRGainLast24Hours, player.VRGainLastWeek, player.VRGainLastMonth) =
                        await _vrHistoryRepository.CalculateAllVRGainsAsync(player.Pid);

                    _logger.LogDebug("Tracked VR change for {Name} ({Pid}): new gains recalculated",
                        player.Name, player.Pid);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to recalculate VR gains for player {Name} ({Pid})",
                        player.Name, player.Pid);
                }
            }

            // Flush gain updates if any, reuse the existing bulk path
            if (vrChangedPlayers.Count > 0)
            {
                var gainUpdates = vrChangedPlayers.ToDictionary(
                    x => x.Player.Pid,
                    x => (x.Player.VRGainLast24Hours, x.Player.VRGainLastWeek, x.Player.VRGainLastMonth));
                await _playerRepository.UpdatePlayerVRGainsBatchAsync(gainUpdates);
            }

            // Invalidate Mii caches for players whose Mii data changed
            foreach (var pid in miiInvalidations)
                await _playerMiiRepository.InvalidatePlayerMiiCacheAsync(pid);

            _logger.LogInformation("API refresh completed. New: {NewCount}, Updated: {UpdatedCount}",
                toInsert.Count, toUpdate.Count);
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
    /// <param name="now">The current UTC timestamp to use for LastSeen/LastUpdated, passed in so all players in a batch share the same value.</param>
    // Returns true if the player's Mii data changed (so the caller can invalidate the cache row).
    private async Task<bool> UpdateExistingPlayer(PlayerEntity existingPlayer, ExternalPlayer apiPlayer, DateTime now)
    {
        var previousVR = existingPlayer.Ev;

        if (existingPlayer.IsBanned)
        {
            existingPlayer.IsBanned = false;
            _logger.LogInformation(
                "Ban lifted for player seen online: {Name} ({FriendCode}) - PID: {Pid}",
                existingPlayer.Name, existingPlayer.Fc, existingPlayer.Pid);
        }

        if (existingPlayer.Name != apiPlayer.Name)
            existingPlayer.Name = apiPlayer.Name;

        if (existingPlayer.Fc != apiPlayer.Fc)
            existingPlayer.Fc = apiPlayer.Fc;

        if (existingPlayer.Ev != apiPlayer.VR)
        {
            existingPlayer.Ev = apiPlayer.VR;

            var wasSuspicious = existingPlayer.IsSuspicious;
            var update = _validationService.CheckSuspiciousStatus(existingPlayer, previousVR);
            if (update != null)
            {
                existingPlayer.IsSuspicious = update.IsSuspicious;
                existingPlayer.SuspiciousVRJumps = update.SuspiciousVRJumps;
                existingPlayer.FlagReason = update.FlagReason;

                if (update.IsSuspicious && !wasSuspicious)
                    await _discordWebhook.SendAutoFlagAsync(existingPlayer.Name, existingPlayer.Fc, update.FlagReason);
            }
        }

        var miiDataChanged = false;
        var firstMii = apiPlayer.Mii?.FirstOrDefault();
        if (firstMii?.Data != null && existingPlayer.MiiData != firstMii.Data)
        {
            existingPlayer.MiiData = firstMii.Data;
            miiDataChanged = true;

            _logger.LogDebug("Mii data changed for {Name} ({FriendCode}), cached image invalidated",
                existingPlayer.Name, existingPlayer.Fc);
        }

        existingPlayer.LastSeen = now;
        existingPlayer.LastUpdated = now;

        return miiDataChanged;
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
