using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using NSubstitute;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Services.External;
using RetroRewindWebsite.Tests.Integration.Fixtures;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Integration.Services;

/// <summary>
/// The room page asks the room endpoint for Mii images first. That endpoint only had the in-memory
/// cache, which is empty after every restart, so every Mii in a live room went back to Nintendo
/// even when its image was already stored in PlayerMiiCaches.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class RoomMiiImageTests : IAsyncLifetime
{
    private const string Pid = "room-mii-1";
    private const string Fc = "9999-0000-0001";

    private readonly IRetroWFCApiClient _apiClient = Substitute.For<IRetroWFCApiClient>();
    private readonly IMiiService _miiService = Substitute.For<IMiiService>();
    private readonly DateTime _startedAt = DateTime.UtcNow;
    private CustomWebApplicationFactory _factory = null!;

    public async ValueTask InitializeAsync()
    {
        _factory = new StubbedFactory(_apiClient, _miiService);
        await ClearAsync();
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        await ClearAsync();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task UsesTheStoredImageWhenItShowsTheMiiInTheRoom()
    {
        await StorePlayerAsync(miiData: "same-mii", storedImage: "stored-image");
        await ShowInRoomAsync(miiData: "same-mii");

        var images = await GetRoomMiisAsync();

        images.ShouldContainKeyAndValue(Fc, "stored-image");
        await _miiService.DidNotReceive()
            .GetMiiImageAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task IgnoresAStoredImageOfAMiiThePlayerHasSinceChanged()
    {
        // The leaderboard sync skips some rooms, so a stored row can lag behind the live Mii.
        await StorePlayerAsync(miiData: "old-mii", storedImage: "stored-image");
        await ShowInRoomAsync(miiData: "new-mii");
        _miiService.GetMiiImageAsync(Fc, "new-mii", Arg.Any<CancellationToken>()).Returns("fresh-image");

        var images = await GetRoomMiisAsync();

        images.ShouldContainKeyAndValue(Fc, "fresh-image");
    }

    private async Task StorePlayerAsync(string miiData, string storedImage)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        db.Players.Add(new PlayerEntity
        {
            Pid = Pid,
            Name = "Room Mii Tester",
            Fc = Fc,
            MiiData = miiData,
            MiiCache = new PlayerMiiCacheEntity
            {
                MiiImageBase64 = storedImage,
                MiiImageFetchedAt = DateTime.UtcNow
            }
        });

        await db.SaveChangesAsync();
    }

    private async Task ShowInRoomAsync(string miiData)
    {
        _apiClient.GetActiveGroupsAsync(Arg.Any<CancellationToken>()).Returns([
            new Group
            {
                Id = "room-mii",
                Game = "mariokartwii",
                Type = "anybody",
                Players = new()
                {
                    ["0"] = new ExternalPlayer
                    {
                        Count = "1",
                        Pid = Pid,
                        Name = "Room Mii Tester",
                        Fc = Fc,
                        Mii = [new Mii { Data = miiData, Name = "Tester" }]
                    }
                }
            }
        ]);

        await _factory.Services.GetRequiredService<IRoomStatusService>()
            .RefreshRoomDataAsync(persistSnapshot: false);
    }

    private Task<Dictionary<string, string>> GetRoomMiisAsync() =>
        _factory.Services.GetRequiredService<IRoomStatusService>().GetMiiImageBatchAsync([Fc]);

    private async Task ClearAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();

        await db.PlayerMiiCaches.Where(c => c.Player.Pid == Pid).ExecuteDeleteAsync();
        await db.Players.Where(p => p.Pid == Pid).ExecuteDeleteAsync();

        // A fresh RoomStatusService counts any player as a new peak, so every refresh saves a
        // snapshot. Only this test's snapshots are newer than its start.
        await db.RoomSnapshots.Where(s => s.Timestamp >= _startedAt).ExecuteDeleteAsync();
    }

    private sealed class StubbedFactory(IRetroWFCApiClient apiClient, IMiiService miiService)
        : CustomWebApplicationFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IRetroWFCApiClient>();
                services.AddSingleton(apiClient);
                services.RemoveAll<IMiiService>();
                services.AddSingleton(miiService);
            });
        }
    }
}
