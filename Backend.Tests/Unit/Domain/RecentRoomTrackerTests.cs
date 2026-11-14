using RetroRewindWebsite.Models.External;
using RetroRewindWebsite.Services.Domain;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Domain;

[Trait("Category", "Unit")]
public class RecentRoomTrackerTests
{
    [Fact]
    public void OpenRoomsAreReturnedAsOpen()
    {
        var tracker = new RecentRoomTracker(new ManualTimeProvider());

        var rooms = tracker.GetRoomsToCollect([Room("AAAAAA"), Room("BBBBBB")]);

        rooms.Select(r => r.Id).ShouldBe(["AAAAAA", "BBBBBB"]);
        rooms.ShouldAllBe(r => r.IsOpen);
    }

    [Fact]
    public void AClosedRoomIsPolledABoundedNumberOfTimesThenForgotten()
    {
        var tracker = new RecentRoomTracker(new ManualTimeProvider());
        tracker.GetRoomsToCollect([Room("AAAAAA")]);

        for (var i = 0; i < RecentRoomTracker.ClosedRoomPolls; i++)
        {
            var rooms = tracker.GetRoomsToCollect([]);
            rooms.Count.ShouldBe(1);
            rooms[0].IsOpen.ShouldBeFalse();
        }

        tracker.GetRoomsToCollect([]).ShouldBeEmpty();
    }

    [Fact]
    public void AClosedRoomKeepsTheTypeAndKindItHadWhileOpen()
    {
        var tracker = new RecentRoomTracker(new ManualTimeProvider());
        tracker.GetRoomsToCollect([Room("AAAAAA", type: "anybody", rk: "vs_10")]);

        var closed = tracker.GetRoomsToCollect([]).ShouldHaveSingleItem();

        closed.Type.ShouldBe("anybody");
        closed.Rk.ShouldBe("vs_10");
    }

    [Fact]
    public void SeeingARoomOpenAgainResetsItsBudget()
    {
        var tracker = new RecentRoomTracker(new ManualTimeProvider());
        tracker.GetRoomsToCollect([Room("AAAAAA")]);
        tracker.GetRoomsToCollect([]);
        tracker.GetRoomsToCollect([]);

        tracker.GetRoomsToCollect([Room("AAAAAA")]).ShouldHaveSingleItem().IsOpen.ShouldBeTrue();

        for (var i = 0; i < RecentRoomTracker.ClosedRoomPolls; i++)
            tracker.GetRoomsToCollect([]).ShouldHaveSingleItem();
        tracker.GetRoomsToCollect([]).ShouldBeEmpty();
    }

    [Fact]
    public void AClosedRoomIsNeverPolledPastWfcRetention()
    {
        var time = new ManualTimeProvider();
        var tracker = new RecentRoomTracker(time);
        tracker.GetRoomsToCollect([Room("AAAAAA")]);

        time.Advance(RecentRoomTracker.MaxClosedAge + TimeSpan.FromMinutes(1));

        tracker.GetRoomsToCollect([]).ShouldBeEmpty();
    }

    [Fact]
    public void ARoomListedTwiceInOneTickIsReturnedOnce()
    {
        var tracker = new RecentRoomTracker(new ManualTimeProvider());

        tracker.GetRoomsToCollect([Room("AAAAAA"), Room("AAAAAA")]).ShouldHaveSingleItem();
    }

    private static Group Room(string id, string type = "anybody", string? rk = "vs_10") => new()
    {
        Id = id,
        Game = "mariokartwii",
        Type = type,
        Rk = rk,
        Players = [],
        Created = DateTime.UtcNow
    };

    private sealed class ManualTimeProvider : TimeProvider
    {
        private DateTimeOffset _now = new(2026, 11, 14, 12, 0, 0, TimeSpan.Zero);

        public override DateTimeOffset GetUtcNow() => _now;

        public void Advance(TimeSpan by) => _now += by;
    }
}
