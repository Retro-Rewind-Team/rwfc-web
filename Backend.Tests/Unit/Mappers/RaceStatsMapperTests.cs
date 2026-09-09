using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.Entities.RaceResult;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Mappers;

[Trait("Category", "Unit")]
public class RaceStatsMapperTests
{
    [Fact]
    public void MapRaces_PutsPlayersWhoDidNotFinishAfterEveryFinisher()
    {
        var key = new RaceKey("room-1", 1, new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc), 1, 2, 4);

        // Deliberately out of order, and FinishPos 0 means the player did not finish. Ordering on
        // FinishPos alone would sort those two to the front, ahead of first place.
        var participants = new List<RaceResultEntity>
        {
            Participant(key, profileId: 300, finishPos: 0),
            Participant(key, profileId: 100, finishPos: 2),
            Participant(key, profileId: 400, finishPos: 0),
            Participant(key, profileId: 200, finishPos: 1)
        };

        var races = RaceStatsMapper.MapRaces([key], participants, new Dictionary<short, string>(), []);

        var entries = races.ShouldHaveSingleItem().Participants;
        entries.Select(e => e.ProfileId).Take(2).ShouldBe([200L, 100L]);
        entries.Select(e => e.FinishPos).Take(2).ShouldBe([(short)1, (short)2]);

        // Both non-finishers come last, still carrying the 0 sentinel the UI reads.
        entries.Skip(2).Select(e => e.FinishPos).ShouldAllBe(p => p == 0);
    }

    private static RaceResultEntity Participant(RaceKey key, long profileId, short finishPos) => new()
    {
        RoomId = key.RoomId,
        RaceNumber = key.RaceNumber,
        RaceTimestamp = key.RaceTimestamp,
        PlayerCount = key.PlayerCount,
        CourseId = key.CourseId,
        EngineClassId = key.EngineClassId,
        ProfileId = profileId,
        PlayerId = 0,
        FinishPos = finishPos,
        FinishTime = finishPos == 0 ? 0 : BitConverter.SingleToInt32Bits(90f + finishPos),
        CharacterId = 0,
        VehicleId = 0,
        FramesIn1st = 0
    };

    [Fact]
    public void ToPlayerStatsDto_MapsAllFieldsFromPlayerEntity()
    {
        var player = new PlayerEntity
        {
            Pid = "pid-1",
            Name = "TestPlayer",
            Fc = "1234-5678-9012",
            Ev = 8500,
            Rank = 42,
            LastSeen = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            LastUpdated = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IsSuspicious = false,
            VRGainLast24Hours = 100,
            VRGainLastWeek = 300,
            VRGainLastMonth = 700,
            MiiData = ""
        };

        var dto = RaceStatsMapper.ToPlayerStatsDto(player, raceStats: null);

        dto.Pid.ShouldBe("pid-1");
        dto.Name.ShouldBe("TestPlayer");
        dto.Fc.ShouldBe("1234-5678-9012");
        dto.Vr.ShouldBe(8500);
        dto.Rank.ShouldBe(42);
        dto.IsSuspicious.ShouldBeFalse();
        dto.VrGain24h.ShouldBe(100);
        dto.VrGain7d.ShouldBe(300);
        dto.VrGain30d.ShouldBe(700);
        dto.RaceStats.ShouldBeNull();
    }

    [Fact]
    public void MapCharacterEntries_ReturnsMappedNameAndCount()
    {
        var raw = new List<(short Id, int Count)> { ((short)0, 5), ((short)1, 3) };

        var result = RaceStatsMapper.MapCharacterEntries(raw);

        result.Count.ShouldBe(2);
        result[0].RaceCount.ShouldBe(5);
        result[1].RaceCount.ShouldBe(3);
        result[0].Name.ShouldNotBeNullOrEmpty();
        result[1].Name.ShouldNotBeNullOrEmpty();
    }
}
