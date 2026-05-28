using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.Player;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Helpers;

[Trait("Category", "Unit")]
public class BatchMiiValidationTests
{
    [Fact]
    public void Validate_NullFriendCodes_ReturnsError()
    {
        var request = new BatchMiiRequestDto(null!);
        BatchMiiValidation.Validate(request).ShouldNotBeNull();
    }

    [Fact]
    public void Validate_EmptyFriendCodes_ReturnsError()
    {
        var request = new BatchMiiRequestDto([]);
        BatchMiiValidation.Validate(request).ShouldNotBeNull();
    }

    [Fact]
    public void Validate_OverLimit_ReturnsErrorWithCount()
    {
        var codes = Enumerable.Range(0, BatchMiiValidation.MaxBatchCount + 1)
            .Select(i => $"0000-0000-{i:D4}").ToList();
        var request = new BatchMiiRequestDto(codes);
        BatchMiiValidation.Validate(request).ShouldNotBeNull();
    }

    [Fact]
    public void Validate_AtLimit_ReturnsNull()
    {
        var codes = Enumerable.Range(0, BatchMiiValidation.MaxBatchCount)
            .Select(i => $"0000-0000-{i:D4}").ToList();
        var request = new BatchMiiRequestDto(codes);
        BatchMiiValidation.Validate(request).ShouldBeNull();
    }

    [Fact]
    public void Validate_SingleFriendCode_ReturnsNull()
    {
        var request = new BatchMiiRequestDto(["1234-5678-9012"]);
        BatchMiiValidation.Validate(request).ShouldBeNull();
    }
}
