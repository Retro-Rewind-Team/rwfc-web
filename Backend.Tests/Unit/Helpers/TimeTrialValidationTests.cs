using RetroRewindWebsite.Helpers;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Helpers;

[Trait("Category", "Unit")]
public class TimeTrialValidationTests
{
    // ===== ValidateCc =====

    [Theory]
    [InlineData((short)150)]
    [InlineData((short)200)]
    public void ValidateCc_ValidValue_ReturnsNull(short cc)
    {
        TimeTrialValidation.ValidateCc(cc).ShouldBeNull();
    }

    [Theory]
    [InlineData((short)0)]
    [InlineData((short)100)]
    [InlineData((short)300)]
    public void ValidateCc_InvalidValue_ReturnsErrorMessage(short cc)
    {
        TimeTrialValidation.ValidateCc(cc).ShouldNotBeNull();
    }

    // ===== ParseCategoryFilters — shroomless =====

    [Theory]
    [InlineData("only", true)]
    [InlineData("ONLY", true)]
    [InlineData("exclude", false)]
    [InlineData("EXCLUDE", false)]
    [InlineData(null, null)]
    [InlineData("anything", null)]
    public void ParseCategoryFilters_Shroomless_ParsedCorrectly(string? input, bool? expected)
    {
        var (shroomless, _, _) = TimeTrialValidation.ParseCategoryFilters(input, null);
        shroomless.ShouldBe(expected);
    }

    // ===== ParseCategoryFilters — vehicle =====

    [Theory]
    [InlineData("karts", (short)0, (short)17)]
    [InlineData("KARTS", (short)0, (short)17)]
    [InlineData("bikes", (short)18, (short)35)]
    [InlineData("BIKES", (short)18, (short)35)]
    public void ParseCategoryFilters_KnownVehicle_ReturnsMappedRange(string input, short expectedMin, short expectedMax)
    {
        var (_, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(null, input);
        vehicleMin.ShouldBe(expectedMin);
        vehicleMax.ShouldBe(expectedMax);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("unknown")]
    public void ParseCategoryFilters_UnknownVehicle_ReturnsNullRange(string? input)
    {
        var (_, vehicleMin, vehicleMax) = TimeTrialValidation.ParseCategoryFilters(null, input);
        vehicleMin.ShouldBeNull();
        vehicleMax.ShouldBeNull();
    }

    // ===== ParseCategoryFiltersWithDrift — drift type =====

    [Theory]
    [InlineData("manual", (short)0)]
    [InlineData("MANUAL", (short)0)]
    [InlineData("hybrid", (short)1)]
    [InlineData("HYBRID", (short)1)]
    public void ParseCategoryFiltersWithDrift_KnownDrift_ReturnsMappedValue(string input, short expected)
    {
        var (_, _, _, driftType, _) = TimeTrialValidation.ParseCategoryFiltersWithDrift(null, null, input, null);
        driftType.ShouldBe(expected);
    }

    // ===== ParseCategoryFiltersWithDrift — drift category =====

    [Theory]
    [InlineData("outside", (short)0)]
    [InlineData("OUTSIDE", (short)0)]
    [InlineData("inside", (short)1)]
    [InlineData("INSIDE", (short)1)]
    public void ParseCategoryFiltersWithDrift_KnownDriftCategory_ReturnsMappedValue(string input, short expected)
    {
        var (_, _, _, _, driftCategory) = TimeTrialValidation.ParseCategoryFiltersWithDrift(null, null, null, input);
        driftCategory.ShouldBe(expected);
    }

    [Fact]
    public void ParseCategoryFiltersWithDrift_AllNullParams_AllNulls()
    {
        var (shroomless, vehicleMin, vehicleMax, driftType, driftCategory) =
            TimeTrialValidation.ParseCategoryFiltersWithDrift(null, null, null, null);

        shroomless.ShouldBeNull();
        vehicleMin.ShouldBeNull();
        vehicleMax.ShouldBeNull();
        driftType.ShouldBeNull();
        driftCategory.ShouldBeNull();
    }

    // ===== ParseCategoryFiltersWithDrift — unknown drift type =====

    [Theory]
    [InlineData(null)]
    [InlineData("unknown")]
    public void ParseCategoryFiltersWithDrift_UnknownDrift_ReturnsNull(string? input)
    {
        var (_, _, _, driftType, _) = TimeTrialValidation.ParseCategoryFiltersWithDrift(null, null, input, null);
        driftType.ShouldBeNull();
    }

    // ===== ParseCategoryFiltersWithDrift — unknown drift category =====

    [Theory]
    [InlineData(null)]
    [InlineData("unknown")]
    public void ParseCategoryFiltersWithDrift_UnknownDriftCategory_ReturnsNull(string? input)
    {
        var (_, _, _, _, driftCategory) = TimeTrialValidation.ParseCategoryFiltersWithDrift(null, null, null, input);
        driftCategory.ShouldBeNull();
    }
}
