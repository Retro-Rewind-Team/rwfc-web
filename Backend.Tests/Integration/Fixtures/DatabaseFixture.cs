using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Player;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Fixtures;

[CollectionDefinition("Integration")]
public class IntegrationCollection : ICollectionFixture<DatabaseFixture> { }

public class DatabaseFixture : IAsyncLifetime
{
    internal CustomWebApplicationFactory Factory { get; } = new();
    // Shared across all tests in the collection — do not mutate DefaultRequestHeaders;
    // set auth headers per-request via new HttpRequestMessage instead.
    public HttpClient Client { get; private set; } = null!;

    public async ValueTask InitializeAsync()
    {
        Client = Factory.CreateClient();

        // Program.cs runs migrations at startup, but call MigrateAsync as a safety net
        // in case the rr_test database was created fresh outside the app lifecycle
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        await db.Database.MigrateAsync();

        await TruncateBaselineTablesAsync(db);
        await SeedBaselineDataAsync(db);
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        try
        {
            using var scope = Factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            await TruncateBaselineTablesAsync(db);
        }
        finally
        {
            Client.Dispose();
            await Factory.DisposeAsync();
        }
    }

    private static async Task SeedBaselineDataAsync(LeaderboardDbContext db)
    {
        db.Players.AddRange(
            new PlayerEntity
            {
                Pid = "test-pid-1", Name = "Player1", Fc = "0000-0000-0001",
                Ev = 5000, Rank = 1, MiiData = "",
                LastSeen = DateTime.UtcNow, LastUpdated = DateTime.UtcNow,
                IsSuspicious = false, SuspiciousVRJumps = 0,
                VRGainLast24Hours = 0, VRGainLastWeek = 0, VRGainLastMonth = 0
            },
            new PlayerEntity
            {
                Pid = "test-pid-2", Name = "Player2", Fc = "0000-0000-0002",
                Ev = 4000, Rank = 2, MiiData = "",
                LastSeen = DateTime.UtcNow, LastUpdated = DateTime.UtcNow,
                IsSuspicious = false, SuspiciousVRJumps = 0,
                VRGainLast24Hours = 0, VRGainLastWeek = 0, VRGainLastMonth = 0
            },
            new PlayerEntity
            {
                Pid = "test-pid-3", Name = "Player3", Fc = "0000-0000-0003",
                Ev = 3000, Rank = 3, MiiData = "",
                LastSeen = DateTime.UtcNow, LastUpdated = DateTime.UtcNow,
                IsSuspicious = false, SuspiciousVRJumps = 0,
                VRGainLast24Hours = 0, VRGainLastWeek = 0, VRGainLastMonth = 0
            }
        );

        await db.SaveChangesAsync();
    }

    private static async Task TruncateBaselineTablesAsync(LeaderboardDbContext db)
    {
        // CASCADE truncates dependent tables (VRHistories, PlayerMiiCaches) automatically
        await db.Database.ExecuteSqlRawAsync("""TRUNCATE TABLE "Players" CASCADE""");
    }
}
