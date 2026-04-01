using RetroRewindWebsite.Models.Entities.RaceResult;

namespace RetroRewindWebsite.Repositories.RaceResult;

public interface IRaceStatsRepository
{
    // ===== PLAYER =====

    /// <summary>
    /// Asynchronously retrieves the total number of races completed by the specified player, optionally filtered by
    /// date and course.
    /// </summary>
    /// <param name="profileId">The unique identifier of the player whose race count is to be retrieved.</param>
    /// <param name="after">An optional date and time. Only races completed after this date are included. If null, all races are considered.</param>
    /// <param name="courseId">An optional course identifier. Only races on this course are included. If null, races on all courses are
    /// considered.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the total number of races matching
    /// the specified criteria.</returns>
    Task<int> GetTotalRaceCountByPlayerAsync(long profileId, DateTime? after, short? courseId);

    /// <summary>
    /// Asynchronously retrieves the timestamp of the earliest recorded race, if available.
    /// </summary>
    /// <returns>A task that represents the asynchronous operation. The task result contains the timestamp of the earliest race,
    /// or null if no races are recorded.</returns>
    Task<DateTime?> GetEarliestRaceTimestampAsync();

    /// <summary>
    /// Asynchronously retrieves the most frequently played tracks for a specified player, optionally filtered by date
    /// and course.
    /// </summary>
    /// <param name="profileId">The unique identifier of the player whose track statistics are to be retrieved.</param>
    /// <param name="limit">The maximum number of top tracks to return. Must be a positive integer.</param>
    /// <param name="after">An optional filter to include only tracks played after the specified date and time. If null, no date filter is
    /// applied.</param>
    /// <param name="courseId">An optional filter to include only tracks from the specified course. If null, tracks from all courses are
    /// considered.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a course ID and the corresponding play count, ordered by play count in descending order. The list contains at
    /// most the specified number of items.</returns>
    Task<List<(short CourseId, int Count)>> GetTopTracksByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId);

    /// <summary>
    /// Asynchronously retrieves the top characters used by a player, ranked by usage count.
    /// </summary>
    /// <param name="profileId">The unique identifier of the player profile for which to retrieve character usage statistics.</param>
    /// <param name="limit">The maximum number of top characters to return. Must be a positive integer.</param>
    /// <param name="after">An optional filter to include only character usage records after the specified date and time. If null, all
    /// records are considered.</param>
    /// <param name="courseId">An optional course identifier to restrict results to a specific course. If null, results are not filtered by
    /// course.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a character ID and the corresponding usage count, ordered by count in descending order. The list may be empty if
    /// no usage data is found.</returns>
    Task<List<(short Id, int Count)>> GetTopCharactersByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId);

    /// <summary>
    /// Asynchronously retrieves the top vehicles used by a specific player, ranked by usage count.
    /// </summary>
    /// <param name="profileId">The unique identifier of the player profile for which to retrieve vehicle usage statistics.</param>
    /// <param name="limit">The maximum number of top vehicles to return. Must be a positive integer.</param>
    /// <param name="after">An optional filter to include only vehicle usage records after the specified date and time. If null, all records
    /// are considered.</param>
    /// <param name="courseId">An optional course identifier to filter vehicle usage by a specific course. If null, usage across all courses is
    /// included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a vehicle ID and its corresponding usage count, ordered by count in descending order. The list may be empty if
    /// no usage data is found.</returns>
    Task<List<(short Id, int Count)>> GetTopVehiclesByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId);

    /// <summary>
    /// Asynchronously retrieves the most frequently used character and vehicle combinations for a specified player
    /// profile.
    /// </summary>
    /// <param name="profileId">The unique identifier of the player profile for which to retrieve combination statistics.</param>
    /// <param name="limit">The maximum number of top combinations to return. Must be a positive integer.</param>
    /// <param name="after">An optional filter specifying that only combinations used after this date and time are considered. If null, all
    /// available data is included.</param>
    /// <param name="courseId">An optional course identifier to filter results to a specific course. If null, combinations from all courses are
    /// included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a character ID, vehicle ID, and the count of times that combination was used, ordered by descending count. The
    /// list may be empty if no data matches the criteria.</returns>
    Task<List<(short CharacterId, short VehicleId, int Count)>> GetTopCombosByPlayerAsync(long profileId, int limit, DateTime? after, short? courseId);

    /// <summary>
    /// Asynchronously retrieves the total number of frames in which the specified player finished in first place,
    /// optionally filtered by date and course.
    /// </summary>
    /// <param name="profileId">The unique identifier of the player whose first-place finishes are to be counted.</param>
    /// <param name="after">An optional date and time. Only results after this date are included. If null, all available results are
    /// considered.</param>
    /// <param name="courseId">An optional course identifier. If specified, only results from this course are included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the total number of first-place
    /// frames for the specified player, filtered as requested.</returns>
    Task<long> GetTotalFramesIn1stByPlayerAsync(long profileId, DateTime? after, short? courseId);

    /// <summary>
    /// Asynchronously retrieves a paginated list of recent race results for a specified player profile, optionally
    /// filtered by date and course.
    /// </summary>
    /// <param name="profileId">The unique identifier of the player profile for which to retrieve recent race results.</param>
    /// <param name="page">The zero-based page index indicating which page of results to return. Must be greater than or equal to 0.</param>
    /// <param name="pageSize">The maximum number of race results to include in a single page. Must be a positive integer.</param>
    /// <param name="after">An optional filter to include only races that occurred after the specified date and time. If null, no date
    /// filter is applied.</param>
    /// <param name="courseId">An optional filter to include only races on the specified course. If null, results from all courses are
    /// included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a tuple with a list of recent race
    /// results and the total count of matching races.</returns>
    Task<(List<RaceResultEntity> Rows, int TotalCount)> GetRecentRacesByPlayerAsync(long profileId, int page, int pageSize, DateTime? after, short? courseId);

    // ===== GLOBAL =====

    /// <summary>
    /// Asynchronously retrieves the total number of races that occurred after the specified date and time.
    /// </summary>
    /// <param name="after">The date and time after which races are counted. If null, all races are included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the total number of races that match
    /// the specified criteria.</returns>
    Task<int> GetTotalRaceCountAsync(DateTime? after);

    /// <summary>
    /// Asynchronously retrieves the number of unique players who have participated since the specified date and time.
    /// </summary>
    /// <param name="after">The date and time after which to count unique players. If null, counts all unique players.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the number of unique players found.</returns>
    Task<int> GetUniquePlayerCountAsync(DateTime? after);

    /// <summary>
    /// Asynchronously retrieves a list of all played tracks, grouped by course, with the number of times each course
    /// was played.
    /// </summary>
    /// <param name="after">An optional date and time value that specifies the lower bound for track play records to include. Only tracks
    /// played after this date are returned. If null, all played tracks are included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a course identifier and the count of times that course was played. The list is empty if no tracks match the
    /// criteria.</returns>
    Task<List<(short CourseId, int Count)>> GetAllPlayedTracksAsync(DateTime? after);

    /// <summary>
    /// Asynchronously retrieves a list of the most frequently used characters, ordered by usage count in descending
    /// order.
    /// </summary>
    /// <param name="limit">The maximum number of characters to return. Must be greater than zero.</param>
    /// <param name="after">An optional filter to include only characters used after the specified date and time. If null, all usage records
    /// are considered.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a character ID and its corresponding usage count. The list contains at most the specified number of entries.</returns>
    Task<List<(short Id, int Count)>> GetTopCharactersAsync(int limit, DateTime? after);

    /// <summary>
    /// Asynchronously retrieves a list of the most frequently used vehicles, limited to the specified number of results
    /// and optionally filtered to include only those used after a given date.
    /// </summary>
    /// <param name="limit">The maximum number of vehicles to return. Must be greater than zero.</param>
    /// <param name="after">An optional date and time to filter results. Only vehicles used after this date are included. If null, no date
    /// filtering is applied.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a vehicle identifier and its usage count, ordered by count in descending order. The list may be empty if no
    /// vehicles match the criteria.</returns>
    Task<List<(short Id, int Count)>> GetTopVehiclesAsync(int limit, DateTime? after);

    /// <summary>
    /// Asynchronously retrieves the most frequently used character and vehicle combinations.
    /// </summary>
    /// <param name="limit">The maximum number of combinations to return. Must be greater than zero.</param>
    /// <param name="after">An optional filter to include only combinations used after the specified date and time. If null, all
    /// combinations are considered.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a character ID, a vehicle ID, and the count of times the combination was used. The list is ordered by descending
    /// usage count and contains at most the specified number of items.</returns>
    Task<List<(short CharacterId, short VehicleId, int Count)>> GetTopCombosAsync(int limit, DateTime? after);

    /// <summary>
    /// Asynchronously retrieves a list of the most active player profiles, ordered by activity count.
    /// </summary>
    /// <param name="limit">The maximum number of player profiles to return. Must be greater than zero.</param>
    /// <param name="after">An optional date and time to filter results. Only activity occurring after this date is considered. If null, all
    /// activity is included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// a player profile ID and the corresponding activity count. The list is ordered by activity count in descending
    /// order and contains at most the specified number of entries.</returns>
    Task<List<(long ProfileId, int Count)>> GetMostActivePlayersAsync(int limit, DateTime? after);

    /// <summary>
    /// Asynchronously retrieves the number of races grouped by day of the week, optionally filtering to races that
    /// occurred after a specified date.
    /// </summary>
    /// <param name="after">An optional date and time value. If specified, only races that occurred after this date are included in the
    /// results. If null, all races are considered.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each consisting of
    /// the day of the week (as an integer, where 0 represents Sunday) and the corresponding count of races for that
    /// day. The list will be empty if no races match the criteria.</returns>
    Task<List<(int DayOfWeek, int Count)>> GetRaceCountByDayOfWeekAsync(DateTime? after);

    /// <summary>
    /// Asynchronously retrieves the number of races grouped by hour, optionally filtering to races that occurred after
    /// a specified date and time.
    /// </summary>
    /// <param name="after">The date and time after which to include races. If null, all races are included.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains a list of tuples, each containing
    /// the hour of the day and the corresponding count of races for that hour. The list is empty if no races are found.</returns>
    Task<List<(int Hour, int Count)>> GetRaceCountByHourAsync(DateTime? after);
}
