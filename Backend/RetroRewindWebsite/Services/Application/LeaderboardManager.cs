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
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly ILogger<LeaderboardManager> _logger;

        private const int MiiImageCacheDays = 7;
        private const int MaxVRJumpPerRace = 529;
        private const int MiiFetchTimeoutSeconds = 10;

        public LeaderboardManager(
            IPlayerRepository playerRepository,
            IVRHistoryRepository vrHistoryRepository,
            IRetroWFCApiClient apiClient,
            IPlayerValidationService validationService,
            IMiiService miiService,
            IServiceScopeFactory serviceScopeFactory,
            ILogger<LeaderboardManager> logger)
        {
            _playerRepository = playerRepository;
            _vrHistoryRepository = vrHistoryRepository;
            _apiClient = apiClient;
            _validationService = validationService;
            _miiService = miiService;
            _serviceScopeFactory = serviceScopeFactory;
            _logger = logger;
        }

        // ===== LEADERBOARD QUERIES =====

        public async Task<LeaderboardResponseDto> GetLeaderboardAsync(LeaderboardRequest request)
        {
            var pagedResult = await _playerRepository.GetLeaderboardPageAsync(
                request.Page,
                request.PageSize,
                request.Search,
                request.SortBy,
                request.Ascending);

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
        public async Task<List<TopPlayerDto>> GetTopPlayersNoMiiAsync(int count)
        {
            var players = await _playerRepository.GetTopPlayersAsync(count);
            return [.. players.Select(MapToTopPlayerDto)];
        }

        public async Task<List<PlayerDto>> GetTopVRGainersAsync(int count, string period)
        {
            var timeSpan = period.ToLower() switch
            {
                "24h" or "24" or "day" => TimeSpan.FromDays(1),
                "7d" or "week" => TimeSpan.FromDays(7),
                "30d" or "month" => TimeSpan.FromDays(30),
                _ => TimeSpan.FromDays(1)
            };

            var players = await _playerRepository.GetTopVRGainersAsync(count, timeSpan);
            return [.. players.Select(MapToDtoWithoutMii)];
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

        // ===== PLAYER QUERIES =====

        public async Task<PlayerDto?> GetPlayerAsync(string fc)
        {
            var player = await _playerRepository.GetByFcAsync(fc);
            return player != null ? MapToDto(player) : null;
        }

        public async Task<VRHistoryRangeResponse?> GetPlayerHistoryAsync(string fc, int? days)
        {
            var player = await _playerRepository.GetByFcAsync(fc);
            if (player == null)
            {
                return null;
            }

            List<VRHistoryEntity> history;
            DateTime fromDate;
            DateTime toDate = DateTime.UtcNow;

            if (days.HasValue)
            {
                fromDate = toDate.AddDays(-days.Value);
                history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, fromDate, toDate);
            }
            else
            {
                history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, int.MaxValue);
                fromDate = history.Count > 0 ? history.Min(h => h.Date) : toDate;
            }

            var historyDtos = history.Select(h => new VRHistoryDto
            {
                Date = h.Date,
                VRChange = h.VRChange,
                TotalVR = h.TotalVR
            }).OrderBy(h => h.Date).ToList();

            var startingVR = historyDtos.Count > 0
                ? historyDtos.First().TotalVR - historyDtos.First().VRChange
                : player.Ev;
            var endingVR = historyDtos.Count > 0
                ? historyDtos.Last().TotalVR
                : player.Ev;
            var totalChange = endingVR - startingVR;

            if (historyDtos.Count > 0)
            {
                var firstEntry = historyDtos.First();
                var initialEntry = new VRHistoryDto
                {
                    Date = firstEntry.Date.AddSeconds(-1),
                    VRChange = 0,
                    TotalVR = startingVR
                };
                historyDtos.Insert(0, initialEntry);
            }

            return new VRHistoryRangeResponse
            {
                PlayerId = player.Pid,
                FromDate = fromDate,
                ToDate = toDate,
                History = historyDtos,
                TotalVRChange = totalChange,
                StartingVR = startingVR,
                EndingVR = endingVR
            };
        }

        public async Task<List<VRHistoryDto>?> GetPlayerRecentHistoryAsync(string fc, int count)
        {
            var player = await _playerRepository.GetByFcAsync(fc);
            if (player == null)
            {
                return null;
            }

            var history = await _vrHistoryRepository.GetPlayerHistoryAsync(player.Pid, count);

            return [.. history.Select(h => new VRHistoryDto
            {
                Date = h.Date,
                VRChange = h.VRChange,
                TotalVR = h.TotalVR
            }).OrderBy(h => h.Date)];
        }

        // ===== MII QUERIES =====

        public async Task<string?> GetPlayerMiiAsync(string fc)
        {
            var player = await _playerRepository.GetByFcAsync(fc);

            if (player == null || string.IsNullOrEmpty(player.MiiData))
            {
                _logger.LogDebug("No Mii data available for player {FriendCode}", fc);
                return null;
            }

            if (IsMiiImageCached(player))
            {
                return player.MiiImageBase64;
            }

            try
            {
                var miiImage = await _miiService.GetMiiImageAsync(player.Fc, player.MiiData);

                if (miiImage != null)
                {
                    QueueStoreMiiImageAsync(player.Pid, miiImage, fc);
                }

                return miiImage;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get Mii image for player {FriendCode}", fc);
                return null;
            }
        }

        public async Task<Dictionary<string, string?>> GetPlayerMiisBatchAsync(List<string> friendCodes)
        {
            var result = new Dictionary<string, string?>();

            var players = await _playerRepository.GetPlayersByFriendCodesAsync(friendCodes);
            var playerLookup = players.ToDictionary(p => p.Fc, p => p);

            var tasks = new List<Task<(string fc, string? mii)>>();

            foreach (var fc in friendCodes.Distinct())
            {
                if (!playerLookup.TryGetValue(fc, out var player))
                {
                    result[fc] = null;
                    continue;
                }

                if (string.IsNullOrEmpty(player.MiiData))
                {
                    result[fc] = null;
                    continue;
                }

                if (!string.IsNullOrEmpty(player.MiiImageBase64))
                {
                    result[fc] = player.MiiImageBase64;
                }
                else
                {
                    tasks.Add(FetchAndStoreMiiAsync(player));
                }
            }

            var fetchResults = await Task.WhenAll(tasks);

            foreach (var (fc, mii) in fetchResults)
            {
                result[fc] = mii;
            }

            return result;
        }

        // ===== LEGACY QUERIES =====

        public async Task<bool> HasLegacySnapshotAsync()
        {
            return await _playerRepository.HasLegacySnapshotAsync();
        }

        public async Task<LeaderboardResponseDto> GetLegacyLeaderboardAsync(LeaderboardRequest request)
        {
            var pagedResult = await _playerRepository.GetLegacyLeaderboardPageAsync(
                request.Page,
                request.PageSize,
                request.Search,
                request.SortBy,
                request.Ascending);

            var snapshotDate = pagedResult.Items.FirstOrDefault()?.SnapshotDate ?? DateTime.UtcNow;

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
                MiiImageBase64 = p.MiiImageBase64,
                MiiData = p.MiiData
            }).ToList();

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

        public async Task<PlayerDto?> GetLegacyPlayerAsync(string friendCode)
        {
            var legacyPlayer = await _playerRepository.GetLegacyPlayerByFriendCodeAsync(friendCode);

            if (legacyPlayer == null)
            {
                return null;
            }

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
                MiiImageBase64 = legacyPlayer.MiiImageBase64,
                MiiData = legacyPlayer.MiiData
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
                if (!playerLookup.TryGetValue(fc, out var player))
                {
                    result[fc] = null;
                    continue;
                }

                if (string.IsNullOrEmpty(player.MiiData))
                {
                    result[fc] = null;
                    continue;
                }

                if (!string.IsNullOrEmpty(player.MiiImageBase64))
                {
                    result[fc] = player.MiiImageBase64;
                }
                else
                {
                    tasks.Add(FetchLegacyMiiAsync(fc, player.MiiData));
                }
            }

            var fetchResults = await Task.WhenAll(tasks);

            foreach (var (fc, mii) in fetchResults)
            {
                result[fc] = mii;
            }

            return result;
        }

        // ===== BACKGROUND OPERATIONS =====

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

        // ===== PRIVATE HELPER METHODS =====

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

        private static PlayerDto MapToDtoWithoutMii(PlayerEntity entity)
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
                MiiImageBase64 = null,
                MiiData = entity.MiiData
            };
        }

        private static TopPlayerDto MapToTopPlayerDto(PlayerEntity entity)
        {
            return new TopPlayerDto
            {
                Name = entity.Name,
                FriendCode = entity.Fc,
                VR = entity.Ev,
                Rank = entity.Rank,
                MiiData = entity.MiiData
            };
        }
        private static bool IsMiiImageCached(PlayerEntity player)
        {
            return !string.IsNullOrEmpty(player.MiiImageBase64) &&
                   player.MiiImageFetchedAt.HasValue &&
                   player.MiiImageFetchedAt.Value > DateTime.UtcNow.AddDays(-MiiImageCacheDays);
        }

        private void QueueStoreMiiImageAsync(string pid, string miiImage, string fc)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var playerRepository = scope.ServiceProvider.GetRequiredService<IPlayerRepository>();

                    await playerRepository.UpdatePlayerMiiImageAsync(pid, miiImage);
                    _logger.LogDebug("Stored Mii image in database for {FriendCode}", fc);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to store Mii image in database for {FriendCode}", fc);
                }
            });
        }

        private async Task<(string fc, string? mii)> FetchAndStoreMiiAsync(PlayerEntity player)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(MiiFetchTimeoutSeconds));
                var miiImage = await _miiService.GetMiiImageAsync(player.Fc, player.MiiData!)
                    .WaitAsync(cts.Token);

                if (miiImage != null)
                {
                    QueueStoreMiiImageAsync(player.Pid, miiImage, player.Fc);
                }

                return (player.Fc, miiImage);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Timeout fetching Mii for {FriendCode} in batch request", player.Fc);
                return (player.Fc, null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get Mii image for player {FriendCode}", player.Fc);
                return (player.Fc, null);
            }
        }

        private async Task<(string fc, string? mii)> FetchLegacyMiiAsync(string fc, string miiData)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(MiiFetchTimeoutSeconds));
                var miiImage = await _miiService.GetMiiImageAsync(fc, miiData)
                    .WaitAsync(cts.Token);
                return (fc, miiImage);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get legacy Mii image for {FriendCode}", fc);
                return (fc, null);
            }
        }

        private static List<ExternalPlayer> ExtractPlayersFromGroups(List<Group> groups)
        {
            var players = new List<ExternalPlayer>();
            var allowedRoomTypes = new HashSet<string>
            {
                "vs_10", // Retro Tracks
                "vs_11", // Online TT
                "vs_12", // 200cc
                "vs_13", // Item Rain
                "vs_14", // Regular Battle
                "vs_15", // Elimination Battle
                "vs_20", // Custom Tracks
                "vs_21"  // Vanilla Tracks
            };

            foreach (var group in groups)
            {
                // Skip rooms with disallowed room types
                if (!string.IsNullOrEmpty(group.Rk) && !allowedRoomTypes.Contains(group.Rk))
                {
                    continue;
                }

                foreach (var (_, player) in group.Players)
                {
                    if (player.VR <= 0)
                    {
                        continue;
                    }

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
            var previousVR = existingPlayer.Ev;

            if (existingPlayer.Name != apiPlayer.Name)
            {
                existingPlayer.Name = apiPlayer.Name;
            }

            if (existingPlayer.Fc != apiPlayer.Fc)
            {
                existingPlayer.Fc = apiPlayer.Fc;
            }

            if (existingPlayer.Ev != apiPlayer.VR)
            {
                existingPlayer.Ev = apiPlayer.VR;
                _validationService.UpdateSuspiciousStatus(existingPlayer, previousVR);
            }

            if (apiPlayer.Mii != null && apiPlayer.Mii.Count > 0)
            {
                var firstMii = apiPlayer.Mii.FirstOrDefault();
                if (firstMii?.Data != null && existingPlayer.MiiData != firstMii.Data)
                {
                    existingPlayer.MiiData = firstMii.Data;
                    existingPlayer.MiiImageBase64 = null;
                    existingPlayer.MiiImageFetchedAt = null;

                    _logger.LogDebug("Mii data changed for {Name} ({FriendCode}), cached image invalidated",
                        existingPlayer.Name, existingPlayer.Fc);
                }
            }

            existingPlayer.LastSeen = DateTime.UtcNow;
            existingPlayer.LastUpdated = DateTime.UtcNow;

            return true;
        }

        private async Task TrackVRHistoryForPlayerAsync(PlayerEntity player, int previousVR)
        {
            if (player.Ev == previousVR)
            {
                return;
            }

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
    }
}