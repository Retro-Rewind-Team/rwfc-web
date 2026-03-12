using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.TimeTrial;

namespace RetroRewindWebsite.Mappers;

public static class GhostSubmissionMapper
{
    public static GhostSubmissionDetailDto ToDto(GhostSubmissionEntity entity)
    {
        var lapSplitsMs = entity.LapSplitsMs;

        return new GhostSubmissionDetailDto(
            Id: entity.Id,
            TrackId: entity.TrackId,
            TrackName: entity.Track?.Name ?? "Unknown",
            TTProfileId: entity.TTProfileId,
            PlayerName: entity.TTProfile?.DisplayName ?? "Unknown",
            CountryCode: entity.TTProfile?.CountryCode ?? 0,
            CountryAlpha2: entity.TTProfile?.CountryCode != null
                ? CountryCodeHelper.GetAlpha2Code(entity.TTProfile.CountryCode)
                : null,
            CountryName: entity.TTProfile?.CountryCode != null
                ? CountryCodeHelper.GetCountryName(entity.TTProfile.CountryCode)
                : null,
            CC: entity.CC,
            FinishTimeMs: entity.FinishTimeMs,
            FinishTimeDisplay: entity.FinishTimeDisplay,
            VehicleId: entity.VehicleId,
            CharacterId: entity.CharacterId,
            ControllerType: entity.ControllerType,
            DriftType: entity.DriftType,
            Shroomless: entity.Shroomless,
            Glitch: entity.Glitch,
            DriftCategory: entity.DriftCategory,
            MiiName: entity.MiiName,
            LapCount: entity.LapCount,
            LapSplitsMs: lapSplitsMs,
            LapSplitsDisplay: FormatLapSplits(lapSplitsMs),
            FastestLapMs: GetFastestLap(lapSplitsMs),
            FastestLapDisplay: lapSplitsMs.Count > 0
                ? FormatLapTime(GetFastestLap(lapSplitsMs))
                : string.Empty,
            GhostFilePath: entity.GhostFilePath,
            DateSet: entity.DateSet,
            SubmittedAt: entity.SubmittedAt,
            VehicleName: MarioKartMappings.GetVehicleName(entity.VehicleId),
            CharacterName: MarioKartMappings.GetCharacterName(entity.CharacterId),
            ControllerName: MarioKartMappings.GetControllerName(entity.ControllerType),
            DriftTypeName: MarioKartMappings.GetDriftTypeName(entity.DriftType),
            DriftCategoryName: MarioKartMappings.GetDriftCategoryName(entity.DriftCategory),
            TrackSlotName: entity.Track?.TrackSlot
        );
    }

    public static string FormatLapTime(int milliseconds)
    {
        var totalSeconds = milliseconds / 1000.0;
        var minutes = (int)(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        return $"{minutes}:{seconds:00.000}";
    }

    public static List<string> FormatLapSplits(List<int> lapSplitsMs)
        => [.. lapSplitsMs.Select(FormatLapTime)];

    public static int GetFastestLap(List<int> lapSplitsMs)
        => lapSplitsMs.DefaultIfEmpty(0).Min();
}
