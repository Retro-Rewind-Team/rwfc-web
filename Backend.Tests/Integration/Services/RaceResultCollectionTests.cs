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
/// Covers the ingest path into RaceResults. The position WFC reports is unreliable, so the
/// collector recomputes it from finish times, and a split room (one WFC session that fractured
/// into independent sub-races sharing a RoomId and RaceNumber) has to be ranked per sub-race.
/// Getting this wrong writes bad data into the table every statistic is derived from.
/// </summary>
[Collection("Integration")]
[Trait("Category", "Integration")]
public class RaceResultCollectionTests : IAsyncLifetime
{
    private const string RoomId = "rrc-1";

    private CustomWebApplicationFactory _factory = null!;
    private readonly IRetroWFCApiClient _apiClient = Substitute.For<IRetroWFCApiClient>();

    public ValueTask InitializeAsync()
    {
        _factory = new StubbedApiFactory(_apiClient);
        return ValueTask.CompletedTask;
    }

    public async ValueTask DisposeAsync()
    {
        GC.SuppressFinalize(this);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
            await db.RaceResults.Where(r => r.RoomId == RoomId).ExecuteDeleteAsync();
        }

        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task RecomputesFinishPositionFromFinishTimeRatherThanTrustingTheReportedValue()
    {
        // Every reported FinishPos below is deliberately wrong; only the times are meaningful.
        StubRace(
            Result(profileId: 101, seconds: 95f, playerCount: 3, reportedPos: 3),
            Result(profileId: 102, seconds: 90f, playerCount: 3, reportedPos: 1),
            Result(profileId: 103, seconds: 100f, playerCount: 3, reportedPos: 2));

        await CollectAsync();

        var byProfile = await StoredAsync();
        byProfile[102].FinishPos.ShouldBe((short)1);
        byProfile[101].FinishPos.ShouldBe((short)2);
        byProfile[103].FinishPos.ShouldBe((short)3);
    }

    [Fact]
    public async Task RanksEachSubRaceOfASplitRoomSeparately()
    {
        // One RoomId and RaceNumber, two sub-races distinguished only by PlayerCount. Ranking
        // across the whole set would give the 2-player sub-race positions 3 and 4.
        StubRace(
            Result(profileId: 201, seconds: 90f, playerCount: 3),
            Result(profileId: 202, seconds: 95f, playerCount: 3),
            Result(profileId: 203, seconds: 100f, playerCount: 3),
            Result(profileId: 204, seconds: 120f, playerCount: 2),
            Result(profileId: 205, seconds: 130f, playerCount: 2));

        await CollectAsync();

        var byProfile = await StoredAsync();

        byProfile[201].FinishPos.ShouldBe((short)1);
        byProfile[202].FinishPos.ShouldBe((short)2);
        byProfile[203].FinishPos.ShouldBe((short)3);

        // The slower sub-race starts again at 1, not 4.
        byProfile[204].FinishPos.ShouldBe((short)1);
        byProfile[205].FinishPos.ShouldBe((short)2);
    }

    [Fact]
    public async Task StoresZeroForPlayersWhoDidNotFinishAndRanksOnlyTheFinishers()
    {
        StubRace(
            Result(profileId: 301, seconds: 90f, playerCount: 3),
            RawResult(profileId: 302, finishTime: 0, playerCount: 3),
            Result(profileId: 303, seconds: 95f, playerCount: 3));

        await CollectAsync();

        var byProfile = await StoredAsync();

        byProfile[301].FinishPos.ShouldBe((short)1);
        // Second among finishers, not third overall: the non-finisher takes no position.
        byProfile[303].FinishPos.ShouldBe((short)2);
        byProfile[302].FinishPos.ShouldBe((short)0);
    }

    [Fact]
    public async Task SkipsCoopGuestsAndKeepsOnlyTheOnlineRacer()
    {
        StubRace(
            Result(profileId: 401, seconds: 90f, playerCount: 2),
            // PlayerID 1 is a local guest on the same console; never stored.
            RawResult(profileId: 401, finishTime: BitConverter.SingleToInt32Bits(85f), playerCount: 2, playerId: 1),
            Result(profileId: 402, seconds: 95f, playerCount: 2));

        await CollectAsync();

        var stored = await StoredAsync();
        stored.Count.ShouldBe(2);
        stored.Values.ShouldAllBe(r => r.PlayerId == 0);

        // The guest's faster time must not have taken the win from 401's own run.
        stored[401].FinishPos.ShouldBe((short)1);
    }

    [Fact]
    public async Task CollectingTwiceDoesNotDuplicateRows()
    {
        StubRace(
            Result(profileId: 501, seconds: 90f, playerCount: 2),
            Result(profileId: 502, seconds: 95f, playerCount: 2));

        await CollectAsync();
        await CollectAsync();

        (await StoredAsync()).Count.ShouldBe(2);
    }

    private async Task CollectAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRaceResultService>();
        await service.CollectRaceResultsAsync();
    }

    private async Task<Dictionary<long, RetroRewindWebsite.Models.Entities.RaceResult.RaceResultEntity>> StoredAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
        var rows = await db.RaceResults.AsNoTracking()
            .Where(r => r.RoomId == RoomId)
            .ToListAsync(TestContext.Current.CancellationToken);
        return rows.ToDictionary(r => r.ProfileId);
    }

    private void StubRace(params RaceResult[] results)
    {
        _apiClient.GetActiveGroupsAsync(Arg.Any<CancellationToken>()).Returns([
            new Group
            {
                Id = RoomId,
                Game = "mariokartwii",
                Type = "anybody",
                Rk = "vs_10",
                Players = [],
                Created = DateTime.UtcNow
            }
        ]);

        _apiClient.GetRoomRaceResultsAsync(RoomId, Arg.Any<CancellationToken>())
            .Returns(new Dictionary<int, List<RaceResult>> { [1] = [.. results] });
    }

    private static RaceResult Result(long profileId, float seconds, short playerCount, short reportedPos = 0) =>
        RawResult(profileId, BitConverter.SingleToInt32Bits(seconds), playerCount, reportedPos: reportedPos);

    private static RaceResult RawResult(
        long profileId, int finishTime, short playerCount, int playerId = 0, short reportedPos = 0) => new()
        {
            ProfileID = profileId,
            PlayerID = playerId,
            FinishTime = finishTime,
            CharacterID = 0,
            VehicleID = 0,
            PlayerCount = playerCount,
            FinishPos = reportedPos,
            FramesIn1st = 0,
            CourseID = 1,
            EngineClassID = 2
        };

    /// <summary>Swaps the WFC client for a substitute so canned race data can be fed in.</summary>
    private sealed class StubbedApiFactory(IRetroWFCApiClient apiClient) : CustomWebApplicationFactory
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
