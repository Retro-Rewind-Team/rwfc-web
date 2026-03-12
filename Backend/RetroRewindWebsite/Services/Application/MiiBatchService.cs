using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Services.Domain;

namespace RetroRewindWebsite.Services.Application;

public class MiiBatchService : IMiiBatchService
{
    private readonly IPlayerRepository _playerRepository;
    private readonly IMiiService _miiService;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<MiiBatchService> _logger;

    private const int MiiImageCacheDays = 7;
    private const int MiiFetchTimeoutSeconds = 10;

    public MiiBatchService(
        IPlayerRepository playerRepository,
        IMiiService miiService,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<MiiBatchService> logger)
    {
        _playerRepository = playerRepository;
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
            return player.MiiImageBase64;

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
        var playerLookup = players.ToDictionary(p => p.Fc, p => p);
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

            tasks.Add(FetchAndStoreMiiAsync(player));
        }

        foreach (var (fc, mii) in await Task.WhenAll(tasks))
            result[fc] = mii;

        return result;
    }

    public async Task<Dictionary<string, string?>> GetLegacyPlayerMiisBatchAsync(List<string> friendCodes)
    {
        var result = new Dictionary<string, string?>();
        var legacyPlayers = await _playerRepository.GetLegacyPlayersByFriendCodesAsync(friendCodes);
        var playerLookup = legacyPlayers.ToDictionary(p => p.Fc, p => p);
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

    private static bool IsMiiImageCached(Models.Entities.Player.PlayerEntity player) =>
        !string.IsNullOrEmpty(player.MiiImageBase64) &&
        player.MiiImageFetchedAt.HasValue &&
        player.MiiImageFetchedAt.Value > DateTime.UtcNow.AddDays(-MiiImageCacheDays);

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

    private async Task<(string fc, string? mii)> FetchAndStoreMiiAsync(
        Models.Entities.Player.PlayerEntity player)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(MiiFetchTimeoutSeconds));
            var miiImage = await _miiService
                .GetMiiImageAsync(player.Fc, player.MiiData!)
                .WaitAsync(cts.Token);

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

    private async Task<(string fc, string? mii)> FetchLegacyMiiAsync(string fc, string miiData)
    {
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(MiiFetchTimeoutSeconds));
            var miiImage = await _miiService
                .GetMiiImageAsync(fc, miiData)
                .WaitAsync(cts.Token);
            return (fc, miiImage);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get legacy Mii image for {FriendCode}", fc);
            return (fc, null);
        }
    }
}
