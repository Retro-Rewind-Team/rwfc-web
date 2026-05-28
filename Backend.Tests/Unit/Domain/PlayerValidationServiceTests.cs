using Microsoft.Extensions.Logging.Abstractions;
using RetroRewindWebsite.Models.Entities.Player;
using RetroRewindWebsite.Services.Domain;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Domain;

[Trait("Category", "Unit")]
public class PlayerValidationServiceTests
{
    private readonly PlayerValidationService _sut = new(NullLogger<PlayerValidationService>.Instance);

    // ===== IsSuspiciousNewPlayer =====

    [Theory]
    [InlineData(19999, false)]
    [InlineData(20000, true)]
    [InlineData(25000, true)]
    public void IsSuspiciousNewPlayer_BoundaryValues(int vr, bool expected)
    {
        _sut.IsSuspiciousNewPlayer(vr).ShouldBe(expected);
    }

    // ===== IsSuspiciousVRJump =====

    [Theory]
    [InlineData(530, 20000, true)]  // exceeds per-race max (529), so true regardless of high-VR path
    [InlineData(529, 20000, false)] // at per-race max -- not suspicious (not strictly greater)
    [InlineData(5000, 20000, true)] // both conditions true: high VR + large jump, and also > 529
    [InlineData(5000, 19999, true)] // below high-VR threshold, but 5000 > MaxVRJumpPerRace (529)
    [InlineData(529, 19999, false)] // below high-VR threshold AND at per-race max -- not suspicious
    public void IsSuspiciousVRJump_VariousInputs(int vrChange, int currentVR, bool expected)
    {
        _sut.IsSuspiciousVRJump(vrChange, currentVR).ShouldBe(expected);
    }

    // ===== CheckSuspiciousStatus -- no change =====

    [Fact]
    public void CheckSuspiciousStatus_NormalVRChange_ReturnsNull()
    {
        var player = new PlayerEntity { Pid = "p1", Name = "Test", Fc = "0000-0000-0000", MiiData = "", Ev = 5000, SuspiciousVRJumps = 0, IsSuspicious = false };
        _sut.CheckSuspiciousStatus(player, previousVR: 4800).ShouldBeNull();
    }

    // ===== CheckSuspiciousStatus -- path 1: high VR + large jump -> immediate flag =====

    [Fact]
    public void CheckSuspiciousStatus_HighVRLargeJump_FlagsImmediately()
    {
        // Ev=25000 >= 20000 threshold, jump = 25000-19000 = 6000 >= 5000 threshold
        var player = new PlayerEntity { Pid = "p1", Name = "Test", Fc = "0000-0000-0000", MiiData = "", Ev = 25000, SuspiciousVRJumps = 0, IsSuspicious = false };

        var result = _sut.CheckSuspiciousStatus(player, previousVR: 19000);

        result.ShouldNotBeNull();
        result!.IsSuspicious.ShouldBeTrue();
    }

    // ===== CheckSuspiciousStatus -- path 2: over-max jump, count below threshold -> accumulate =====

    [Fact]
    public void CheckSuspiciousStatus_OverMaxJump_BelowCountThreshold_AccumulatesWithoutFlagging()
    {
        // jump = 5530 - 5000 = 530 > MaxVRJumpPerRace(529), count goes 0 -> 1 (threshold is 5)
        var player = new PlayerEntity { Pid = "p1", Name = "Test", Fc = "0000-0000-0000", MiiData = "", Ev = 5530, SuspiciousVRJumps = 0, IsSuspicious = false };

        var result = _sut.CheckSuspiciousStatus(player, previousVR: 5000);

        result.ShouldNotBeNull();
        result!.IsSuspicious.ShouldBeFalse();
        result.SuspiciousVRJumps.ShouldBe(1);
    }

    // ===== CheckSuspiciousStatus -- path 2: reaching count threshold -> flag =====

    [Fact]
    public void CheckSuspiciousStatus_OverMaxJump_ReachesCountThreshold_Flags()
    {
        // SuspiciousVRJumps = 4, one more jump hits threshold (5)
        var player = new PlayerEntity { Pid = "p1", Name = "Test", Fc = "0000-0000-0000", MiiData = "", Ev = 5530, SuspiciousVRJumps = 4, IsSuspicious = false };

        var result = _sut.CheckSuspiciousStatus(player, previousVR: 5000);

        result.ShouldNotBeNull();
        result!.IsSuspicious.ShouldBeTrue();
        result.SuspiciousVRJumps.ShouldBe(5);
    }
}
