using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.Entities.Player;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Mappers;

[Trait("Category", "Unit")]
public class RaceStatsMapperTests
{
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
