using RetroRewindWebsite.Models.DTOs.TimeTrial;
using RetroRewindWebsite.Models.Entities.TimeTrial;

namespace RetroRewindWebsite.Mappers;

/// <summary>
/// Maps <see cref="TrackEntity"/> instances to their corresponding DTOs.
/// </summary>
public static class TrackMapper
{
    /// <summary>
    /// Maps a track entity to its DTO.
    /// </summary>
    public static TrackDto ToDto(TrackEntity track) => new(
        track.Id,
        track.Name,
        track.CourseId,
        track.Category,
        track.Laps,
        track.SupportsGlitch,
        track.SortOrder
    );
}
