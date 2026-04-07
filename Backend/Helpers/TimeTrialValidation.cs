namespace RetroRewindWebsite.Helpers;

/// <summary>
/// Static helpers for parsing and validating time trial query string parameters.
/// Returns <see langword="null"/> on success, or an error message string on failure,
/// callers pass the message to <c>BadRequest()</c>.
/// </summary>
public static class TimeTrialValidation
{
    private const short CC_150 = 150;
    private const short CC_200 = 200;

    /// <summary>
    /// Validates that <paramref name="cc"/> is either 150 or 200.
    /// Returns an error message if invalid, otherwise <see langword="null"/>.
    /// </summary>
    public static string? ValidateCc(short cc) =>
        cc != CC_150 && cc != CC_200 ? $"CC must be either {CC_150} or {CC_200}" : null;

    /// <summary>
    /// Parses <c>shroomless</c> and <c>vehicle</c> query string parameters into typed filter values.
    /// </summary>
    /// <param name="shroomless">"only", "exclude", or null/anything else (= no filter).</param>
    /// <param name="vehicle">"karts", "bikes", or null/anything else (= no filter).</param>
    public static (bool? Shroomless, short? VehicleMin, short? VehicleMax) ParseCategoryFilters(
        string? shroomless,
        string? vehicle)
    {
        bool? shroomlessFilter = shroomless?.ToLower() switch
        {
            "only" => true,
            "exclude" => false,
            _ => null
        };

        short? vehicleMin = null;
        short? vehicleMax = null;
        switch (vehicle?.ToLower())
        {
            case "karts": vehicleMin = 0; vehicleMax = 17; break;
            case "bikes": vehicleMin = 18; vehicleMax = 35; break;
        }

        return (shroomlessFilter, vehicleMin, vehicleMax);
    }

    /// <summary>
    /// Parses <c>shroomless</c>, <c>vehicle</c>, <c>drift</c>, and <c>driftCategory</c>
    /// query string parameters into typed filter values, for endpoints that support full
    /// category filtering (e.g. BKT lookup).
    /// </summary>
    /// <param name="shroomless">"true" to filter for shroomless runs, "false" for non-shroomless, or null (= no filter).</param>
    /// <param name="vehicle">"kart", "bike", or null (= no filter). Maps to a min/max vehicle ID range.</param>
    /// <param name="drift">"manual", "hybrid", or null/anything else (= no filter).</param>
    /// <param name="driftCategory">"outside", "inside", or null/anything else (= no filter).</param>
    public static (bool? Shroomless, short? VehicleMin, short? VehicleMax, short? DriftType, short? DriftCategory) ParseCategoryFiltersWithDrift(
        string? shroomless,
        string? vehicle,
        string? drift,
        string? driftCategory)
    {
        var (shroomlessFilter, vehicleMin, vehicleMax) = ParseCategoryFilters(shroomless, vehicle);

        short? driftTypeFilter = drift?.ToLower() switch
        {
            "manual" => (short)0,
            "hybrid" => (short)1,
            _ => null
        };

        short? driftCategoryFilter = driftCategory?.ToLower() switch
        {
            "outside" => (short)0,
            "inside" => (short)1,
            _ => null
        };

        return (shroomlessFilter, vehicleMin, vehicleMax, driftTypeFilter, driftCategoryFilter);
    }
}
