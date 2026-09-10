using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Application;

/// <summary>
/// Pre-fetches and caches Mii images for a batch of players, refreshing stale entries on a configurable schedule.
/// </summary>
public class MiiBatchService : IMiiBatchService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IPlayerMiiRepository _playerMiiRepository;
    private readonly ILegacyPlayerRepository _legacyPlayerRepository;
    private readonly IMiiService _miiService;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<MiiBatchService> _logger;

    private const int MiiImageCacheDays = 7;
    private const int MiiFetchTimeoutSeconds = 10;

    /// <summary>
    /// Caps how many cache writes may run in the background at once. Each one takes a connection
    /// from a pool of 10, so a large batch of uncached Miis must not be able to claim all of them.
    /// The service is scoped, so this has to be static to bound anything.
    /// </summary>
    private static readonly SemaphoreSlim _storeSlots = new(4, 4);

    public MiiBatchService(
        IPlayerRepository playerRepository,
        IPlayerMiiRepository playerMiiRepository,
        ILegacyPlayerRepository legacyPlayerRepository,
        IMiiService miiService,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<MiiBatchService> logger)
    {
        _playerRepository = playerRepository;
        _playerMiiRepository = playerMiiRepository;
        _legacyPlayerRepository = legacyPlayerRepository;
        _miiService = miiService;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task<string?> GetPlayerMiiAsync(string fc)
    {
        var player = await _playerRepository.GetByFcAsync(fc);

        if (player == null || string.IsNullOrEmpty(player.MiiData))
        {
            _logger.LogDebug("No Mii data available for player {FriendCode}", fc);
            return null;
        }

        if (IsMiiImageCached(player))
            return player.MiiCache!.MiiImageBase64;

        try
        {
            var miiImage = await _miiService.GetMiiImageAsync(player.Fc, player.MiiData);

            if (miiImage != null)
                QueueStoreMiiImageAsync(player.Pid, miiImage, fc);

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
        // Build a lookup keyed by FC so we can resolve each requested code in O(1). Fc carries a
        // plain index, not a unique one, so a duplicate row would make ToDictionary throw and fail
        // the whole batch. Keep the row most likely to answer instead.
        var playerLookup = players
            .GroupBy(p => p.Fc)
            .ToDictionary(g => g.Key, g => g
                .OrderByDescending(p => !string.IsNullOrEmpty(p.MiiData))
                .ThenByDescending(p => p.MiiCache?.MiiImageFetchedAt ?? DateTime.MinValue)
                .First());
        // Collect live-fetch tasks separately so they can run concurrently via Task.WhenAll
        var tasks = new List<Task<(string fc, string? mii)>>();

        foreach (var fc in friendCodes.Distinct())
        {
            if (!playerLookup.TryGetValue(fc, out var player) ||
                string.IsNullOrEmpty(player.MiiData))
            {
                result[fc] = null;
                continue;
            }

            if (IsMiiImageCached(player))
            {
                // Cache hit = return immediately without a network call
                result[fc] = player.MiiCache!.MiiImageBase64;
                continue;
            }

            tasks.Add(FetchAndStoreMiiAsync(player));
        }

        // Await all in-flight fetches concurrently rather than sequentially
        foreach (var (fc, mii) in await Task.WhenAll(tasks))
            result[fc] = mii;

        return result;
    }

    public async Task<Dictionary<string, string?>> GetLegacyPlayerMiisBatchAsync(List<string> friendCodes)
    {
        var result = new Dictionary<string, string?>();
        var legacyPlayers = await _legacyPlayerRepository.GetLegacyPlayersByFriendCodesAsync(friendCodes);
        // Same non-unique Fc index as the live table, so collapse duplicates rather than throwing.
        var playerLookup = legacyPlayers
            .GroupBy(p => p.Fc)
            .ToDictionary(g => g.Key, g => g
                .OrderByDescending(p => !string.IsNullOrEmpty(p.MiiImageBase64))
                .ThenByDescending(p => !string.IsNullOrEmpty(p.MiiData))
                .First());
        var tasks = new List<Task<(string fc, string? mii)>>();

        foreach (var fc in friendCodes.Distinct())
        {
            if (!playerLookup.TryGetValue(fc, out var player) ||
                string.IsNullOrEmpty(player.MiiData))
            {
                result[fc] = null;
                continue;
            }

            if (!string.IsNullOrEmpty(player.MiiImageBase64))
            {
                result[fc] = player.MiiImageBase64;
                continue;
            }

            tasks.Add(FetchLegacyMiiAsync(fc, player.MiiData));
        }

        foreach (var (fc, mii) in await Task.WhenAll(tasks))
            result[fc] = mii;

        return result;
    }

    /// <summary>
    /// Determines whether the player's Mii image is cached and still valid based on the cache duration.
    /// </summary>
    /// <remarks>The cache is considered valid if the player's Mii image is present and was fetched within the
    /// configured cache duration. This method does not refresh or update the cache.</remarks>
    /// <param name="player">The player entity whose Mii image cache status is being evaluated. Cannot be null.</param>
    /// <returns>A value indicating whether the player's Mii image is cached and has not expired. Returns <see langword="true"/>
    /// if the image is cached and valid; otherwise, <see langword="false"/>.</returns>
    private static bool IsMiiImageCached(Models.Entities.Player.PlayerEntity player) =>
        player.MiiCache != null &&
        player.MiiCache.MiiImageFetchedAt > DateTime.UtcNow.AddDays(-MiiImageCacheDays);

    /// <summary>
    /// Queues an asynchronous operation to store a Mii image for the specified player.
    /// </summary>
    /// <remarks>The operation is performed in a background task and does not block the calling thread. Any
    /// exceptions encountered during the operation are logged and do not propagate to the caller.</remarks>
    /// <param name="pid">The unique identifier of the player whose Mii image will be updated. Cannot be null.</param>
    /// <param name="miiImage">The Mii image data to store for the player. Cannot be null.</param>
    /// <param name="fc">The friend code associated with the player. Used for logging purposes.</param>
    private void QueueStoreMiiImageAsync(string pid, string miiImage, string fc)
    {
        // Take a slot up front rather than inside the task, so a batch of uncached players queues
        // at most _storeSlots writes instead of one Task.Run per player. Storing is a cache warm:
        // dropping it when the slots are busy just means the next request refetches.
        if (!_storeSlots.Wait(0))
        {
            _logger.LogDebug("Mii store slots busy, skipped caching image for {FriendCode}", fc);
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceScopeFactory.CreateScope();
                var playerMiiRepository = scope.ServiceProvider.GetRequiredService<IPlayerMiiRepository>();
                await playerMiiRepository.UpdatePlayerMiiImageAsync(pid, miiImage);
                _logger.LogDebug("Stored Mii image in database for {FriendCode}", fc);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to store Mii image in database for {FriendCode}", fc);
            }
            finally
            {
                _storeSlots.Release();
            }
        });
    }

    /// <summary>
    /// Fetches the Mii image for the specified player and stores it asynchronously if available.
    /// </summary>
    /// <remarks>If the Mii image is successfully retrieved, it is queued for storage. If the operation times
    /// out or encounters an error, the returned Mii image will be null. The method logs warnings for timeout and
    /// failure scenarios.</remarks>
    /// <param name="player">The player entity containing the friend code and Mii data used to retrieve the Mii image. Cannot be null.</param>
    /// <returns>A tuple containing the player's friend code and the fetched Mii image as a string. The Mii image will be null if
    /// the fetch operation fails or times out.</returns>
    private async Task<(string fc, string? mii)> FetchAndStoreMiiAsync(
        Models.Entities.Player.PlayerEntity player)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(MiiFetchTimeoutSeconds));
            // Pass the token in rather than WaitAsync-ing on it: WaitAsync stops us waiting but
            // leaves the upstream request running, so a slow Mii renderer keeps the connection.
            var miiImage = await _miiService.GetMiiImageAsync(player.Fc, player.MiiData!, cts.Token);

            if (miiImage != null)
                QueueStoreMiiImageAsync(player.Pid, miiImage, player.Fc);

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

    /// <summary>
    /// Retrieves the legacy Mii image associated with the specified friend code and Mii data.
    /// </summary>
    /// <remarks>If the operation fails or times out, the returned Mii image will be null. The method applies
    /// a timeout to the fetch operation to prevent indefinite waiting.</remarks>
    /// <param name="fc">The friend code used to identify the user whose Mii image is to be fetched.</param>
    /// <param name="miiData">The Mii data string used to generate or locate the legacy Mii image.</param>
    /// <returns>A tuple containing the friend code and the Mii image as a string. The Mii image will be null if the fetch
    /// operation fails.</returns>
    private async Task<(string fc, string? mii)> FetchLegacyMiiAsync(string fc, string miiData)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(MiiFetchTimeoutSeconds));
            var miiImage = await _miiService.GetMiiImageAsync(fc, miiData, cts.Token);
            return (fc, miiImage);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get legacy Mii image for {FriendCode}", fc);
            return (fc, null);
        }
    }
}
