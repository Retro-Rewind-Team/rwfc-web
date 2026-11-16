using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using NSubstitute;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.External;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Services;

/// <summary>
/// WFC only knows a console's country once that console has sent its USER packet, so the groups
/// API leaves the field out until then. The sync must store a country it is given and keep the
/// last one when the field is missing.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class PlayerCountrySyncTests : IAsyncLifetime
{
    private const string Pid = "country-sync-1";
    private const string Fc = "9999-0000-0078";

    private readonly IRetroWFCApiClient _apiClient = Substitute.For<IRetroWFCApiClient>();
    private CustomWebApplicationFactory _factory = null!;

    public async ValueTask InitializeAsync()
    {
        _factory = new StubbedFactory(_apiClient);
        await ClearAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await ClearAsync();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task StoresTheCountryAndKeepsItWhenWfcSendsNone()
    {
        await SyncAsync(country: "78");
        (await StoredCountryAsync()).ShouldBe((byte)78);

        await SyncAsync(country: null);
        (await StoredCountryAsync()).ShouldBe((byte)78);

        await SyncAsync(country: "110");
        (await StoredCountryAsync()).ShouldBe((byte)110);
    }

    private async Task SyncAsync(string? country)
    {
        _apiClient.GetActiveGroupsAsync(Arg.Any<CancellationToken>()).Returns([
            new Group
            {
                Id = "cty-sync",
                Game = "mariokartwii",
                Type = "anybody",
                Rk = "vs_10",
                Players = new()
                {
                    ["0"] = new ExternalPlayer
                    {
                        Count = "1",
                        Pid = Pid,
                        Name = "Country Tester",
                        Fc = Fc,
                        Ev = "5000",
                        Country = country
                    }
                }
            }
        ]);

        using var scope = _factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<ILeaderboardSyncService>().RefreshFromApiAsync();
    }

    private async Task<byte?> StoredCountryAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        return await db.Players.AsNoTracking()
            .Where(p => p.Pid == Pid)
            .Select(p => p.WiiCountryCode)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    private async Task ClearAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        await db.VRHistories.Where(h => h.PlayerId == Pid).ExecuteDeleteAsync();
        await db.Players.Where(p => p.Pid == Pid).ExecuteDeleteAsync();
    }

    private sealed class StubbedFactory(IRetroWFCApiClient apiClient) : CustomWebApplicationFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IRetroWFCApiClient>();
                services.AddSingleton(apiClient);
            });
        }
    }
}
