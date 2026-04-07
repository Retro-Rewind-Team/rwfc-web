namespace RetroRewindWebsite.Models.Domain;

public abstract record GhostFileParseResult
{
    public sealed record Success(
        short CourseId,
        int FinishTimeMs,
        string FinishTimeDisplay,
        short VehicleId,
        short CharacterId,
        short ControllerType,
        short DriftType,
        short DriftCategory,
        string MiiName,
        short LapCount,
        List<int> LapSplitsMs,
        DateOnly DateSet
    ) : GhostFileParseResult;

    public sealed record Failure(string ErrorMessage) : GhostFileParseResult;
}
