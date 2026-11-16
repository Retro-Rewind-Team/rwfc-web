using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Mappers;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Models.External;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Helpers;

/// <summary>
/// WFC passes on the Wii country code each console reports. The site turns it into a flag-icons
/// class and a name, for the leaderboard and profile (stored code) and the room page (live code).
/// </summary>
[Trait("Category", "Unit")]
public class WiiCountryHelperTests
{
    [Theory]
    [InlineData(1, "jp", "Japan")]
    [InlineData(49, "us", "United States")]
    [InlineData(78, "de", "Germany")]
    [InlineData(110, "gb", "United Kingdom")]
    [InlineData(5, "gb-sct", "Scotland")]
    [InlineData(59, "northern-cyprus", "Northern Cyprus")]
    [InlineData(254, "gl", "Greenland")]
    public void MapsAKnownCodeToItsFlagAndName(int code, string flag, string name)
    {
        WiiCountryHelper.GetFlag(code).ShouldBe(flag);
        WiiCountryHelper.GetName(code).ShouldBe(name);
    }

    [Fact]
    public void CoversEveryCodeRrCanSend()
    {
        for (var code = 1; code <= 254; code++)
        {
            WiiCountryHelper.GetFlag(code).ShouldNotBeNullOrEmpty($"code {code}");
            WiiCountryHelper.GetName(code).ShouldNotBeNullOrEmpty($"code {code}");
        }
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    [InlineData(255)]
    public void ShowsNoFlagForAMissingOrUnknownCode(int? code)
    {
        WiiCountryHelper.GetFlag(code).ShouldBeNull();
        WiiCountryHelper.GetName(code).ShouldBeNull();
    }

    [Fact]
    public void PlayerDtoCarriesTheStoredCountry()
    {
        var player = new PlayerEntity { Pid = "1", Name = "Tester", Fc = "0000-0000-0001", MiiData = "", WiiCountryCode = 78 };

        var dto = PlayerMapper.ToDto(player);

        dto.CountryAlpha2.ShouldBe("de");
        dto.CountryName.ShouldBe("Germany");
    }

    [Theory]
    [InlineData("110", "gb")]
    [InlineData(null, null)]
    [InlineData("not-a-number", null)]
    public void RoomPlayersCarryTheLiveCountryThroughASnapshot(string? country, string? flag)
    {
        var group = new Group
        {
            Id = "room",
            Game = "mariokartwii",
            Type = "anybody",
            Players = new()
            {
                ["0"] = new ExternalPlayer { Count = "1", Pid = "1", Name = "Tester", Fc = "0000-0000-0001", Country = country }
            }
        };

        var live = RoomMapper.ToDto(group, []);
        var fromSnapshot = RoomMapper.ToRoomDto(RoomMapper.ToRoomData(live));

        live.Players.Single().CountryAlpha2.ShouldBe(flag);
        fromSnapshot.Players.Single().CountryAlpha2.ShouldBe(flag);
    }
}
