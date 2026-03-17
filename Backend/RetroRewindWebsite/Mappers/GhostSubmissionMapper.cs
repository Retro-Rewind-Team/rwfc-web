using RetroRewindWebsite.Models.Entities.TimeTrial;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Models.DTOs.TimeTrial;

namespace RetroRewindWebsite.Mappers;

public static class GhostSubmissionMapper
{
    /// <summary>
    /// Maps a single entity without rank context.
    /// </summary>
    public static GhostSubmissionDetailDto ToDto(GhostSubmissionEntity entity, int? rank = null)
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
            IsFlap: entity.IsFlap,
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
            TrackSlotName: entity.Track?.TrackSlot,
            Rank: rank
        );
    }

    /// <summary>
    /// Maps a page of regular leaderboard results with Olympic-style ranks (1,1,3).
    /// Rankings are based purely on FinishTimeMs, ties are draws.
    /// pageOffset is (currentPage - 1) * pageSize so ranks are globally correct across pages.
    /// </summary>
    public static List<GhostSubmissionDetailDto> ToLeaderboardDtos(
        IList<GhostSubmissionEntity> entities,
        int pageOffset)
    {
        var result = new List<GhostSubmissionDetailDto>(entities.Count);

        for (int i = 0; i < entities.Count; i++)
        {
            int globalIndex = pageOffset + i;
            int rank;

            if (i == 0)
            {
                rank = globalIndex + 1;
            }
            else
            {
                rank = entities[i].FinishTimeMs == entities[i - 1].FinishTimeMs
                    ? result[i - 1].Rank!.Value
                    : globalIndex + 1;
            }

            result.Add(ToDto(entities[i], rank));
        }

        return result;
    }

    /// <summary>
    /// Maps a page of flap leaderboard results with Olympic-style ranks (1,1,3).
    /// Rankings based on FastestLapMs (MIN of lap splits) — ties are draws.
    /// Since the SQL already sorted by fastest lap, we compare adjacent fastest laps.
    /// </summary>
    public static List<GhostSubmissionDetailDto> ToFlapLeaderboardDtos(
        IList<GhostSubmissionEntity> entities,
        int pageOffset)
    {
        var result = new List<GhostSubmissionDetailDto>(entities.Count);

        for (int i = 0; i < entities.Count; i++)
        {
            int globalIndex = pageOffset + i;
            int rank;

            if (i == 0)
            {
                rank = globalIndex + 1;
            }
            else
            {
                // Rank by fastest lap
                rank = GetFastestLap(entities[i].LapSplitsMs) == GetFastestLap(entities[i - 1].LapSplitsMs)
                    ? result[i - 1].Rank!.Value
                    : globalIndex + 1;
            }

            result.Add(ToDto(entities[i], rank));
        }

        return result;
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
