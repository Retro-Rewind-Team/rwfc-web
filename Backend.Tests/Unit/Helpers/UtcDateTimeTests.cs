using RetroRewindWebsite.Helpers;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Helpers;

[Trait("Category", "Unit")]
public class UtcDateTimeTests
{
    [Fact]
    public void UnspecifiedIsTakenAsUtcWithoutShiftingTheClock()
    {
        var input = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Unspecified);

        var result = UtcDateTime.From(input);

        result.Kind.ShouldBe(DateTimeKind.Utc);
        // The wall-clock reading must survive. ToUniversalTime would move it by the server's
        // offset, so identical requests returned different data on differently-configured hosts.
        result.Hour.ShouldBe(12);
        result.ShouldBe(new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void UtcIsReturnedUnchanged()
    {
        var input = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);

        var result = UtcDateTime.From(input);

        result.ShouldBe(input);
        result.Kind.ShouldBe(DateTimeKind.Utc);
    }

    [Fact]
    public void LocalIsConvertedRatherThanRelabelled()
    {
        var input = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Local);

        var result = UtcDateTime.From(input);

        result.Kind.ShouldBe(DateTimeKind.Utc);
        // SpecifyKind alone would keep 12:00 and call it UTC, silently mis-stamping the value by
        // the local offset. Only zero-offset zones legitimately leave the reading unchanged.
        result.ShouldBe(input.ToUniversalTime());
    }

    [Fact]
    public void NullPassesThrough()
    {
        UtcDateTime.From((DateTime?)null).ShouldBeNull();
    }

    [Fact]
    public void NullableOverloadNormalisesAValue()
    {
        DateTime? input = new DateTime(2026, 5, 1, 12, 0, 0, DateTimeKind.Unspecified);

        var result = UtcDateTime.From(input);

        result!.Value.Kind.ShouldBe(DateTimeKind.Utc);
        result.Value.Hour.ShouldBe(12);
    }
}
