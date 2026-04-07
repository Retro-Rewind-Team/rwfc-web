namespace RetroRewindWebsite.Services.Background;

/// <summary>
/// Base class for background services that execute periodic work guarded by a semaphore.
/// Subclasses implement <see cref="ExecuteOnceAsync"/> with their service-specific logic and
/// override <c>ExecuteAsync</c> to define their polling loop (delay interval, initial
/// execute-before-loop, etc.). The semaphore, scope factory, force-refresh, and dispose
/// boilerplate are handled here.
/// </summary>
public abstract class PollingBackgroundService : BackgroundService
{
    protected readonly IServiceScopeFactory ServiceScopeFactory;
    protected readonly ILogger Logger;
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    protected const int SemaphoreTimeoutSeconds = 30;

    protected PollingBackgroundService(IServiceScopeFactory serviceScopeFactory, ILogger logger)
    {
        ServiceScopeFactory = serviceScopeFactory;
        Logger = logger;
    }

    /// <summary>
    /// Executes the service's work for one polling cycle using a fresh DI scope.
    /// </summary>
    protected abstract Task ExecuteOnceAsync(IServiceProvider services, CancellationToken cancellationToken);

    /// <summary>
    /// Acquires the semaphore, creates a DI scope, calls <see cref="ExecuteOnceAsync"/>, then
    /// releases. Skips the cycle with a warning if the semaphore times out.
    /// </summary>
    protected async Task PerformAsync(CancellationToken cancellationToken)
    {
        if (!await _semaphore.WaitAsync(TimeSpan.FromSeconds(SemaphoreTimeoutSeconds), cancellationToken))
        {
            Logger.LogWarning("Previous operation is still running, skipping this cycle");
            return;
        }

        try
        {
            using var scope = ServiceScopeFactory.CreateScope();
            await ExecuteOnceAsync(scope.ServiceProvider, cancellationToken);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    /// <summary>
    /// Triggers an immediate out-of-band execution without waiting for the next scheduled cycle.
    /// </summary>
    public virtual async Task ForceRefreshAsync()
    {
        Logger.LogInformation("Force refresh requested");
        await PerformAsync(CancellationToken.None);
    }

    public override void Dispose()
    {
        _semaphore?.Dispose();
        base.Dispose();
        GC.SuppressFinalize(this);
    }
}
