using System.ComponentModel.DataAnnotations;

namespace RetroRewindWebsite.Models.DTOs.TimeTrial;

public record TTProfileDto(
    int Id,
    string DisplayName,
    int TotalSubmissions,
    int CurrentWorldRecords,
    int CountryCode,
    string? CountryAlpha2,
    string? CountryName
);

public class CreateTTProfileRequest
{
    [Required(ErrorMessage = "Display name is required")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Display name must be between 2 and 50 characters")]
    public required string DisplayName { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Country code must be a positive number")]
    public int? CountryCode { get; set; }
}

public class UpdateTTProfileRequest
{
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Display name must be between 2 and 50 characters")]
    public string? DisplayName { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Country code must be a positive number")]
    public int? CountryCode { get; set; }
}
