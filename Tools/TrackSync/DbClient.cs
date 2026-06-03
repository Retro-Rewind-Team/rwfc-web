namespace TrackSync;

using Npgsql;
using NpgsqlTypes;
using System.Text;

public record NewTrackDetails(
    string Name, short CourseId, int SortOrder,
    string Category, short Laps, bool SupportsGlitch);

public class DbClient(string connectionString)
{
    public async Task<List<DbTrack>> LoadTracksAsync()
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(
            """
            SELECT "Id","Name","CourseId","SortOrder","IsHidden","Category","Laps","SupportsGlitch"
            FROM "Tracks"
            """, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        var tracks = new List<DbTrack>();
        while (await reader.ReadAsync())
            tracks.Add(new DbTrack(
                reader.GetInt32(0), reader.GetString(1), reader.GetInt16(2),
                reader.GetInt32(3), reader.GetBoolean(4), reader.GetString(5),
                reader.GetInt16(6), reader.GetBoolean(7)));
        return tracks;
    }

    public async Task<int> CountRaceResultsAffectedAsync(
        List<(short OldCourseId, short NewCourseId)> mappings, DateTime cutoff)
    {
        if (mappings.Count == 0) return 0;
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        var inClause = string.Join(",", mappings.Select((_, i) => $"@old{i}"));
        await using var cmd = new NpgsqlCommand(
            $"""SELECT COUNT(*) FROM "RaceResults" WHERE "CourseId" IN ({inClause}) AND "RaceTimestamp" < @cutoff""",
            conn);
        for (int i = 0; i < mappings.Count; i++)
            cmd.Parameters.AddWithValue($"old{i}", mappings[i].OldCourseId);
        cmd.Parameters.Add(new NpgsqlParameter("cutoff", NpgsqlDbType.TimestampTz) { Value = cutoff });
        var result = await cmd.ExecuteScalarAsync();
        return result is null or DBNull ? 0 : Convert.ToInt32(result);
    }

    public async Task ApplyDiffAsync(DiffResult diff, List<NewTrackDetails> newTrackDetails, DateTime cutoff)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // Step 1: Update Tracks.CourseId by Id (no cascade risk in Tracks table itself)
            foreach (var c in diff.CourseIdChanges)
            {
                await using var cmd = new NpgsqlCommand(
                    """UPDATE "Tracks" SET "CourseId"=@n WHERE "Id"=@id""", conn, tx);
                cmd.Parameters.AddWithValue("n", c.NewCourseId);
                cmd.Parameters.AddWithValue("id", c.TrackId);
                await cmd.ExecuteNonQueryAsync();
            }

            // Step 2: Update RaceResults.CourseId with a single CASE statement to avoid
            // cascade corruption when CourseIds shift into each other's old values
            var mappings = DiffEngine.GetDistinctCourseMappings(diff);
            if (mappings.Count > 0)
            {
                var sb = new StringBuilder("""UPDATE "RaceResults" SET "CourseId"=CASE "CourseId" """);
                var p = new List<NpgsqlParameter>();
                for (int i = 0; i < mappings.Count; i++)
                {
                    sb.Append($"WHEN @old{i} THEN @new{i} ");
                    p.Add(new NpgsqlParameter($"old{i}", mappings[i].OldCourseId));
                    p.Add(new NpgsqlParameter($"new{i}", mappings[i].NewCourseId));
                }
                var inList = string.Join(",", Enumerable.Range(0, mappings.Count).Select(i => $"@old{i}"));
                sb.Append($"""END WHERE "CourseId" IN ({inList}) AND "RaceTimestamp"<@cutoff""");
                p.Add(new NpgsqlParameter("cutoff", NpgsqlDbType.TimestampTz) { Value = cutoff });
                await using var cmd = new NpgsqlCommand(sb.ToString(), conn, tx);
                cmd.Parameters.AddRange(p.ToArray());
                await cmd.ExecuteNonQueryAsync();
            }

            // Step 3: Update SortOrder
            foreach (var c in diff.SortOrderChanges)
            {
                await using var cmd = new NpgsqlCommand(
                    """UPDATE "Tracks" SET "SortOrder"=@n WHERE "Id"=@id""", conn, tx);
                cmd.Parameters.AddWithValue("n", c.NewSortOrder);
                cmd.Parameters.AddWithValue("id", c.TrackId);
                await cmd.ExecuteNonQueryAsync();
            }

            // Step 4: Re-activate hidden tracks (IsHidden = false)
            foreach (var t in diff.ReactivatedTracks)
            {
                await using var cmd = new NpgsqlCommand(
                    """UPDATE "Tracks" SET "IsHidden"=false WHERE "Id"=@id""", conn, tx);
                cmd.Parameters.AddWithValue("id", t.TrackId);
                await cmd.ExecuteNonQueryAsync();
            }

            // Step 5: Hide removed tracks (IsHidden = true)
            foreach (var t in diff.HiddenTracks)
            {
                await using var cmd = new NpgsqlCommand(
                    """UPDATE "Tracks" SET "IsHidden"=true WHERE "Id"=@id""", conn, tx);
                cmd.Parameters.AddWithValue("id", t.TrackId);
                await cmd.ExecuteNonQueryAsync();
            }

            // Step 6: Insert new tracks
            foreach (var t in newTrackDetails)
            {
                await using var cmd = new NpgsqlCommand(
                    """
                    INSERT INTO "Tracks"
                        ("Name","CourseId","Category","Laps","SupportsGlitch","IsHidden","SortOrder","CreatedAt")
                    VALUES
                        (@name,@courseId,@category,@laps,@sg,false,@so,@now)
                    """, conn, tx);
                cmd.Parameters.AddWithValue("name", t.Name);
                cmd.Parameters.AddWithValue("courseId", t.CourseId);
                cmd.Parameters.AddWithValue("category", t.Category);
                cmd.Parameters.AddWithValue("laps", t.Laps);
                cmd.Parameters.AddWithValue("sg", t.SupportsGlitch);
                cmd.Parameters.AddWithValue("so", t.SortOrder);
                cmd.Parameters.Add(new NpgsqlParameter("now", NpgsqlDbType.TimestampTz) { Value = DateTime.UtcNow });
                await cmd.ExecuteNonQueryAsync();
            }

            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task ApplyRestoreAsync(BackupData backup)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // Step 1: Reverse RaceResults.CourseId with single CASE (new->old)
            // Uses CASE for the same reason as forward direction: shift cascades
            var mappings = backup.RaceResultCourseMappings;
            if (mappings.Count > 0)
            {
                var sb = new StringBuilder("""UPDATE "RaceResults" SET "CourseId"=CASE "CourseId" """);
                var p = new List<NpgsqlParameter>();
                for (int i = 0; i < mappings.Count; i++)
                {
                    sb.Append($"WHEN @old{i} THEN @new{i} ");
                    p.Add(new NpgsqlParameter($"old{i}", mappings[i].NewCourseId)); // match current (new) value
                    p.Add(new NpgsqlParameter($"new{i}", mappings[i].OldCourseId)); // restore to old value
                }
                var inList = string.Join(",", Enumerable.Range(0, mappings.Count).Select(i => $"@old{i}"));
                sb.Append($"""END WHERE "CourseId" IN ({inList}) AND "RaceTimestamp"<@cutoff""");
                p.Add(new NpgsqlParameter("cutoff", NpgsqlDbType.TimestampTz) { Value = backup.UpdateCutoff });
                await using var cmd = new NpgsqlCommand(sb.ToString(), conn, tx);
                cmd.Parameters.AddRange(p.ToArray());
                await cmd.ExecuteNonQueryAsync();
            }

            // Step 2: Restore Tracks rows to backed-up state
            foreach (var t in backup.Tracks)
            {
                await using var cmd = new NpgsqlCommand(
                    """
                    UPDATE "Tracks"
                    SET "CourseId"=@courseId,"SortOrder"=@so,"IsHidden"=@hidden
                    WHERE "Id"=@id
                    """, conn, tx);
                cmd.Parameters.AddWithValue("courseId", t.CourseId);
                cmd.Parameters.AddWithValue("so", t.SortOrder);
                cmd.Parameters.AddWithValue("hidden", t.IsHidden);
                cmd.Parameters.AddWithValue("id", t.Id);
                await cmd.ExecuteNonQueryAsync();
            }

            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
