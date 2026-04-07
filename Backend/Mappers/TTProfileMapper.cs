using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Mappers;

/// <summary>
/// Maps <see cref="TTProfileEntity"/> instances to their corresponding DTOs.
/// </summary>
public static class TTProfileMapper
{
    /// <summary>
    /// Maps a TT profile entity to its DTO, resolving the numeric country code to
    /// both an alpha-2 code and a display name via <see cref="CountryCodeHelper"/>.
    /// </summary>
    public static TTProfileDto ToDto(TTProfileEntity profile) => new(
        profile.Id,
        profile.DisplayName,
        profile.TotalSubmissions,
        profile.CurrentWorldRecords,
        profile.CountryCode,
        CountryCodeHelper.GetAlpha2Code(profile.CountryCode),
        CountryCodeHelper.GetCountryName(profile.CountryCode)
    );
}
