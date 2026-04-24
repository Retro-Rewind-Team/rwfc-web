using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Services.Background;

public class RoomStatusBackgroundService : PollingBackgroundService, IRoomStatusBackgroundService
{
    private readonly IRoomStatusService _roomStatusService;

    private const int FastIntervalSeconds = 10;
    private const int PersistEveryTicks = 6; // 6 × 10s = 60s snapshot history cadence

    public RoomStatusBackgroundService(
        IRoomStatusService roomStatusService,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<RoomStatusBackgroundService> logger)
        : base(serviceScopeFactory, logger)
    {
        _roomStatusService = roomStatusService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Logger.LogInformation("Room status background service started");

        await InitializePeaksAsync();

        try
        {
            await _roomStatusService.RefreshRoomDataAsync(persistSnapshot: true);
        }
        catch (OperationCanceledException)
        {
            Logger.LogInformation("Room status background service stopped during initial fetch");
            return;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error during initial room status fetch");
        }

        var tickCount = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(FastIntervalSeconds), stoppingToken);
                tickCount++;
                await _roomStatusService.RefreshRoomDataAsync(persistSnapshot: tickCount % PersistEveryTicks == 0);
            }
            catch (OperationCanceledException)
            {
                Logger.LogInformation("Room status background service is stopping");
                break;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error in room status background service");
            }
        }

        Logger.LogInformation("Room status background service stopped");
    }

    // Called by ForceRefreshAsync, always persist so the snapshot history stays consistent
    protected override async Task ExecuteOnceAsync(IServiceProvider services, CancellationToken cancellationToken)
    {
        await _roomStatusService.RefreshRoomDataAsync(persistSnapshot: true);
    }

    private async Task InitializePeaksAsync()
    {
        try
        {
            await _roomStatusService.InitializePeaksAsync();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error initializing peak player counts, peaks will start at 0");
        }
    }
}
