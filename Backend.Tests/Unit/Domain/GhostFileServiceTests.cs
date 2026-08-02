using Microsoft.Extensions.Logging.Abstractions;
using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Tests.TestHelpers;
using Shouldly;
using System.Text;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Domain;

[Trait("Category", "Unit")]
public class GhostFileServiceTests
{
    private readonly GhostFileService _sut;

    public GhostFileServiceTests()
    {
        _sut = new GhostFileService(NullLogger<GhostFileService>.Instance);
    }

    [Fact]
    public async Task ParseGhostFileAsync_TooSmall_ReturnsFailure()
    {
        using var stream = new MemoryStream(new byte[10]); // less than 0x88
        var result = await _sut.ParseGhostFileAsync(stream);
        result.ShouldBeOfType<GhostFileParseResult.Failure>();
    }

    [Fact]
    public async Task ParseGhostFileAsync_WrongMagic_ReturnsFailure()
    {
        var bytes = new byte[0x88];
        Encoding.ASCII.GetBytes("XXXX").CopyTo(bytes, 0);
        using var stream = new MemoryStream(bytes);
        var result = await _sut.ParseGhostFileAsync(stream);
        result.ShouldBeOfType<GhostFileParseResult.Failure>();
    }

    [Fact]
    public async Task ParseGhostFileAsync_ValidRkg_ReturnsCorrectFinishTime()
    {
        // 1:30.000 = 1*60000 + 30*1000 + 0 = 90000ms
        var bytes = RkgTestData.BuildValidRkg(finishMinutes: 1, finishSeconds: 30, finishMs: 0, trackId: 5, lapCount: 3);
        using var stream = new MemoryStream(bytes);

        var result = await _sut.ParseGhostFileAsync(stream);

        var success = result.ShouldBeOfType<GhostFileParseResult.Success>();
        success.FinishTimeMs.ShouldBe(90000);
        success.CourseId.ShouldBe((short)5);
        success.LapCount.ShouldBe((short)3);
        success.LapSplitsMs.Count.ShouldBe(3);
    }

    [Fact]
    public async Task ParseGhostFileAsync_ValidRkg_ParsesMiiName()
    {
        var bytes = RkgTestData.BuildValidRkg(miiName: "Noel", lapCount: 3);
        using var stream = new MemoryStream(bytes);

        var result = await _sut.ParseGhostFileAsync(stream);

        var success = result.ShouldBeOfType<GhostFileParseResult.Success>();
        success.MiiName.ShouldBe("Noel");
    }

    [Fact]
    public async Task ParseGhostFileAsync_ValidRkg_ParsesVehicleAndCharacter()
    {
        var bytes = RkgTestData.BuildValidRkg(vehicleId: 3, characterId: 7, lapCount: 3);
        using var stream = new MemoryStream(bytes);

        var result = await _sut.ParseGhostFileAsync(stream);

        var success = result.ShouldBeOfType<GhostFileParseResult.Success>();
        success.VehicleId.ShouldBe((short)3);
        success.CharacterId.ShouldBe((short)7);
    }
}
