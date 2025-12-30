using RetroRewindWebsite.Models.DTOs;
using RetroRewindWebsite.Models.Entities;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Services.External;

namespace RetroRewindWebsite.Services.Application
{
    public class LeaderboardManager : ILeaderboardManager
    {
        private readonly IPlayerRepository _playerRepository;
        private readonly IVRHistoryRepository _vrHistoryRepository;
        private readonly IRetroWFCApiClient _apiClient;
        private readonly IPlayerValidationService _validationService;
        private readonly IMiiService _miiService;
        private readonly ILogger<LeaderboardManager> _logger;

        public LeaderboardManager(
            IPlayerRepository playerRepository,
            IVRHistoryRepository vrHistoryRepository,
            IRetroWFCApiClient apiClient,
            IPlayerValidationService validationService,
            IMiiService miiService,
            ILogger<LeaderboardManager> logger)
        {
            _playerRepository = playerRepository;
            _vrHistoryRepository = vrHistoryRepository;
            _apiClient = apiClient;
            _validationService = validationService;
            _miiService = miiService;
            _logger = logger;
        }

        public async Task<LeaderboardResponseDto> GetLeaderboardAsync(LeaderboardRequest request)
        {
            var pagedResult = await _playerRepository.GetLeaderboardPageAsync(
                request.Page, request.PageSize,
                request.Search, request.SortBy, request.Ascending);

            var stats = await GetStatsAsync();

            var playerDtos = pagedResult.Items.Select(MapToDto).ToList();

            return new LeaderboardResponseDto
            {
                Players = playerDtos,
                CurrentPage = pagedResult.CurrentPage,
                TotalPages = pagedResult.TotalPages,
                TotalCount = pagedResult.TotalCount,
                PageSize = pagedResult.PageSize,
                Stats = stats
            };
        }

        public async Task<List<PlayerDto>> GetTopPlayersAsync(int count)
        {
            var players = await _playerRepository.GetTopPlayersAsync(count);
            return [.. players.Select(MapToDto)];
        }

        public async Task<PlayerDto?> GetPlayerAsync(string fc)
        {
            var player = await _playerRepository.GetByFcAsync(fc);
            return player != null ? MapToDto(player) : null;
        }

        public async Task<string?> GetPlayerMiiAsync(string fc)
        {
            var player = await _playerRepository.GetByFcAsync(fc);

            // Player not found or no Mii data
            if (player == null || string.IsNullOrEmpty(player.MiiData))
            {
                _logger.LogDebug("No Mii data available for player {fc}", fc);
                return null;
            }

            // Return cached database image if available and fresh
            if (!string.IsNullOrEmpty(player.MiiImageBase64) &&
                player.MiiImageFetchedAt.HasValue &&
                player.MiiImageFetchedAt.Value > DateTime.UtcNow.AddDays(-7))
            {
                return player.MiiImageBase64;
            }

            try
            {
                var miiImage = await _miiService.GetMiiImageAsync(player.Fc, player.MiiData);

                if (miiImage != null)
                {
                    // Store in database (fire and forget)
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _playerRepository.UpdatePlayerMiiImageAsync(player.Pid, miiImage);
                            _logger.LogDebug("Stored Mii image in database for {fc}", fc);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to store Mii image in database for {fc}", fc);
                        }
                    });
                }

                return miiImage;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get Mii image for player {fc}", fc);
                return null;
            }
        }

        public async Task<Dictionary<string, string?>> GetPlayerMiisBatchAsync(List<string> friendCodes)
        {
            var result = new Dictionary<string, string?>();

            var players = await _playerRepository.GetPlayersByFriendCodesAsync(friendCodes);
            var playerLookup = players.ToDictionary(p => p.Fc, p => p);

            // Process each friend code
            var tasks = new List<Task<(string fc, string? mii)>>();

            foreach (var fc in friendCodes.Distinct())
            {
                if (playerLookup.TryGetValue(fc, out var player))
                {
                    // No Mii data available - skip
                    if (string.IsNullOrEmpty(player.MiiData))
                    {
                        result[fc] = null;
                        continue;
                    }

                    // Check if we have a cached image in database
                    if (!string.IsNullOrEmpty(player.MiiImageBase64))
                    {
                        result[fc] = player.MiiImageBase64;
                    }
                    else
                    {
                        // Need to fetch - MiiService handles throttling
                        tasks.Add(FetchAndStoreMiiAsync(player));
                    }
                }
                else
                {
                    // Player not found
                    result[fc] = null;
                }
            }

            // Wait for all fetch operations
            var fetchResults = await Task.WhenAll(tasks);

            foreach (var (fc, mii) in fetchResults)
            {
                result[fc] = mii;
            }

            return result;
        }

        private async Task<(string fc, string? mii)> FetchAndStoreMiiAsync(PlayerEntity player)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                var miiImage = await _miiService.GetMiiImageAsync(player.Fc, player.MiiData!)
                    .WaitAsync(cts.Token);

                if (miiImage != null)
                {
                    // Store in database for future use (fire and forget)
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _playerRepository.UpdatePlayerMiiImageAsync(player.Pid, miiImage);
                            _logger.LogDebug("Stored Mii image in database for {fc}", player.Fc);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to store Mii image in database for {fc}", player.Fc);
                        }
                    });
                }

                return (player.Fc, miiImage);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Timeout fetching Mii for {fc} in batch request", player.Fc);
                return (player.Fc, null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get Mii image for player {fc}", player.Fc);
                return (player.Fc, null);
            }
        }

        private async Task<(string fc, string? mii)> GetMiiWithSemaphore(string fc, string miiData, SemaphoreSlim semaphore)
        {
            await semaphore.WaitAsync();
            try
            {
                // 10-second timeout for each Mii request
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                var miiTask = _miiService.GetMiiImageAsync(fc, miiData);

                var completedTask = await Task.WhenAny(miiTask, Task.Delay(Timeout.Infinite, cts.Token));

                if (completedTask == miiTask)
                {
                    var miiImage = await miiTask;
                    return (fc, miiImage);
                }
                else
                {
                    _logger.LogWarning("Timeout fetching Mii for {fc} in batch request", fc);
                    return (fc, null);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get Mii image for player {fc}", fc);
                return (fc, null);
            }
            finally
            {
                semaphore.Release();
            }
        }

        public async Task<LeaderboardStatsDto> GetStatsAsync()
        {
            var totalPlayers = await _playerRepository.GetTotalPlayersCountAsync();
            var suspiciousPlayers = await _playerRepository.GetSuspiciousPlayersCountAsync();

            return new LeaderboardStatsDto
            {
                TotalPlayers = totalPlayers,
                SuspiciousPlayers = suspiciousPlayers,
                LastUpdated = DateTime.UtcNow
            };
        }

        public async Task RefreshFromApiAsync()
        {
            _logger.LogInformation("Starting API refresh...");

            try
            {
                var groups = await _apiClient.GetActiveGroupsAsync();
                var apiPlayers = ExtractPlayersFromGroups(groups);

                var uniqueApiPlayers = apiPlayers
                    .GroupBy(p => p.Pid)
                    .Select(g => g.First())
                    .ToList();

                _logger.LogInformation("Found {PlayerCount} active players from API", uniqueApiPlayers.Count);

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
                            _logger.LogWarning("New player flagged as suspicious: {Name} ({Pid}) with VR {VR}",
                                newPlayer.Name, newPlayer.Pid, newPlayer.Ev);
                        }

                        await _playerRepository.AddAsync(newPlayer);
                        newCount++;
                    }
                    else
                    {
                        var previousVR = existingPlayer.Ev;
                        var hasChanges = UpdateExistingPlayer(existingPlayer, apiPlayer);

                        if (hasChanges)
                        {
                            await _playerRepository.UpdateAsync(existingPlayer);
                            updatedCount++;

                            if (existingPlayer.Ev != previousVR)
                            {
                                await TrackVRHistoryForPlayerAsync(existingPlayer, previousVR);
                            }
                        }
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
            _logger.LogInformation("Refreshing player rankings...");

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

        private static List<ExternalPlayer> ExtractPlayersFromGroups(List<Group> groups)
        {
            var players = new List<ExternalPlayer>();

            foreach (var group in groups)
            {
                // Skip private rooms
                if (group.Type == "private")
                    continue;
                foreach (var (_, player) in group.Players)
                {
                    // Skip players with invalid VR
                    if (player.VR <= 0)
                        continue;

                    players.Add(player);
                }
            }

            return players;
        }

        private static PlayerEntity CreatePlayerEntity(ExternalPlayer apiPlayer)
        {
            var miiData = "";
            if (apiPlayer.Mii != null && apiPlayer.Mii.Count > 0)
            {
                var firstMii = apiPlayer.Mii.FirstOrDefault();
                if (firstMii?.Data != null)
                {
                    miiData = firstMii.Data;
                }
            }

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

        private bool UpdateExistingPlayer(PlayerEntity existingPlayer, ExternalPlayer apiPlayer)
        {
            var hasChanges = false;
            var previousVR = existingPlayer.Ev;

            // Update basic info if changed
            if (existingPlayer.Name != apiPlayer.Name)
            {
                existingPlayer.Name = apiPlayer.Name;
                hasChanges = true;
            }

            if (existingPlayer.Fc != apiPlayer.Fc)
            {
                existingPlayer.Fc = apiPlayer.Fc;
                hasChanges = true;
            }

            // Update VR if changed
            if (existingPlayer.Ev != apiPlayer.VR)
            {
                existingPlayer.Ev = apiPlayer.VR;

                // Apply validation rules for VR changes
                _validationService.UpdateSuspiciousStatus(existingPlayer, previousVR);

                hasChanges = true;
            }

            // Update Mii data if available
            if (apiPlayer.Mii != null && apiPlayer.Mii.Count > 0)
            {
                var firstMii = apiPlayer.Mii.FirstOrDefault();
                if (firstMii?.Data != null && existingPlayer.MiiData != firstMii.Data)
                {
                    // MiiData changed - invalidate cached image
                    existingPlayer.MiiData = firstMii.Data;
                    existingPlayer.MiiImageBase64 = null; // Clear cached image
                    existingPlayer.MiiImageFetchedAt = null; // Mark as needing refresh

                    _logger.LogInformation("Mii data changed for {Name} ({Fc}), cached image invalidated",
                        existingPlayer.Name, existingPlayer.Fc);

                    hasChanges = true;
                }
            }

            // Always update last seen and last updated if player is found in API
            existingPlayer.LastSeen = DateTime.UtcNow;
            existingPlayer.LastUpdated = DateTime.UtcNow;

            return hasChanges || true; // Always save to update LastSeen
        }

        private async Task TrackVRHistoryForPlayerAsync(PlayerEntity player, int previousVR)
        {
            if (player.Ev == previousVR)
                return; // No VR change to track

            try
            {
                var vrHistory = new VRHistoryEntity
                {
                    PlayerId = player.Pid,
                    Fc = player.Fc,
                    Date = DateTime.UtcNow,
                    VRChange = player.Ev - previousVR,
                    TotalVR = player.Ev
                };

                await _vrHistoryRepository.AddAsync(vrHistory);

                // Update VR gain statistics
                player.VRGainLast24Hours = await _vrHistoryRepository.CalculateVRGainAsync(
                    player.Pid, TimeSpan.FromDays(1));
                player.VRGainLastWeek = await _vrHistoryRepository.CalculateVRGainAsync(
                    player.Pid, TimeSpan.FromDays(7));
                player.VRGainLastMonth = await _vrHistoryRepository.CalculateVRGainAsync(
                    player.Pid, TimeSpan.FromDays(30));

                _logger.LogDebug("Tracked VR change for {Name} ({Pid}): {Change} ({OldVR} -> {NewVR})",
                    player.Name, player.Pid, vrHistory.VRChange, previousVR, player.Ev);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to track VR history for player {Name} ({Pid})",
                    player.Name, player.Pid);
            }
        }

        private static PlayerDto MapToDto(PlayerEntity entity)
        {
            return new PlayerDto
            {
                Pid = entity.Pid,
                Name = entity.Name,
                FriendCode = entity.Fc,
                VR = entity.Ev,
                Rank = entity.Rank,
                LastSeen = entity.LastSeen,
                IsSuspicious = entity.IsSuspicious,
                VRStats = new VRStatsDto
                {
                    Last24Hours = entity.VRGainLast24Hours,
                    LastWeek = entity.VRGainLastWeek,
                    LastMonth = entity.VRGainLastMonth
                },
                MiiImageBase64 = entity.MiiImageBase64,
                MiiData = entity.MiiData
            };
        }

        public async Task<bool> HasLegacySnapshotAsync()
        {
            return await _playerRepository.HasLegacySnapshotAsync();
        }

        public async Task<LeaderboardResponseDto> GetLegacyLeaderboardAsync(LeaderboardRequest request)
        {
            // Get paginated players from repository
            var pagedResult = await _playerRepository.GetLegacyLeaderboardPageAsync(
                request.Page,
                request.PageSize,
                request.Search,
                request.SortBy,
                request.Ascending);

            // Get the snapshot date from first player
            var snapshotDate = pagedResult.Items.FirstOrDefault()?.SnapshotDate ?? DateTime.UtcNow;

            // Map to DTOs (without Mii images for fast loading)
            var playerDtos = pagedResult.Items.Select(p => new PlayerDto
            {
                Pid = p.Pid,
                Name = p.Name,
                FriendCode = p.Fc,
                VR = p.Ev,
                Rank = p.Rank,
                LastSeen = snapshotDate,
                IsSuspicious = p.IsSuspicious,
                VRStats = new VRStatsDto
                {
                    Last24Hours = 0,
                    LastWeek = 0,
                    LastMonth = 0
                },
                MiiImageBase64 = null,
                MiiData = p.MiiData
            }).ToList();

            // Get stats
            var totalPlayers = await _playerRepository.GetLegacyPlayersCountAsync();
            var suspiciousPlayers = await _playerRepository.GetLegacySuspiciousPlayersCountAsync();

            var stats = new LeaderboardStatsDto
            {
                TotalPlayers = totalPlayers,
                SuspiciousPlayers = suspiciousPlayers,
                LastUpdated = snapshotDate
            };

            return new LeaderboardResponseDto
            {
                Players = playerDtos,
                CurrentPage = pagedResult.CurrentPage,
                TotalPages = pagedResult.TotalPages,
                TotalCount = pagedResult.TotalCount,
                PageSize = pagedResult.PageSize,
                Stats = stats
            };
        }

        public async Task<Dictionary<string, string?>> GetLegacyPlayerMiisBatchAsync(List<string> friendCodes)
        {
            var result = new Dictionary<string, string?>();

            var legacyPlayers = await _playerRepository.GetLegacyPlayersByFriendCodesAsync(friendCodes);
            var playerLookup = legacyPlayers.ToDictionary(p => p.Fc, p => p);

            var tasks = new List<Task<(string fc, string? mii)>>();

            foreach (var fc in friendCodes.Distinct())
            {
                if (playerLookup.TryGetValue(fc, out var player))
                {
                    // No Mii data available
                    if (string.IsNullOrEmpty(player.MiiData))
                    {
                        result[fc] = null;
                        continue;
                    }

                    // Check cached image
                    if (!string.IsNullOrEmpty(player.MiiImageBase64))
                    {
                        result[fc] = player.MiiImageBase64;
                    }
                    else
                    {
                        tasks.Add(FetchLegacyMiiAsync(fc, player.MiiData));
                    }
                }
                else
                {
                    result[fc] = null;
                }
            }

            var fetchResults = await Task.WhenAll(tasks);

            foreach (var (fc, mii) in fetchResults)
            {
                result[fc] = mii;
            }

            return result;
        }

        private async Task<(string fc, string? mii)> FetchLegacyMiiAsync(string fc, string miiData)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                var miiImage = await _miiService.GetMiiImageAsync(fc, miiData)
                    .WaitAsync(cts.Token);
                return (fc, miiImage);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get legacy Mii image for {fc}", fc);
                return (fc, null);
            }
        }

        public async Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode)
        {
            var legacyPlayer = await _playerRepository.GetLegacyPlayerByFriendCodeAsync(friendCode);

            if (legacyPlayer == null)
            {
                return null;
            }

            // Don't fetch Mii image - let frontend use batch endpoint
            return new PlayerDto
            {
                Pid = legacyPlayer.Pid,
                Name = legacyPlayer.Name,
                FriendCode = legacyPlayer.Fc,
                VR = legacyPlayer.Ev,
                Rank = legacyPlayer.Rank,
                LastSeen = legacyPlayer.SnapshotDate,
                IsSuspicious = legacyPlayer.IsSuspicious,
                VRStats = new VRStatsDto
                {
                    Last24Hours = 0,
                    LastWeek = 0,
                    LastMonth = 0
                },
                MiiImageBase64 = null, // Always null
                MiiData = legacyPlayer.MiiData
            };
        }

        public async Task<List<PlayerDto>> GetTopVRGainersAsync(int count, string period)
        {
            TimeSpan timeSpan = period.ToLower() switch
            {
                "24h" or "24" or "day" => TimeSpan.FromDays(1),
                "7d" or "week" => TimeSpan.FromDays(7),
                _ => TimeSpan.FromDays(1)
            };

            var players = await _playerRepository.GetTopVRGainersAsync(count, timeSpan);

            return [.. players.Select(MapToDto)];
        }
    }
}