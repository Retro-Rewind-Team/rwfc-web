using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class RecalculateFinishPositions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Recompute FinishPos for every race result using FinishTime ordering within each race.
            // IEEE 754 positive floats maintain sort order as integers, so ORDER BY FinishTime ASC
            // gives fastest-first. DNF rows (FinishTime = 0) are sorted last by the CASE expression
            // and then overridden to 0 by the outer CASE.
            migrationBuilder.Sql(@"
        UPDATE ""RaceResults"" AS rr
        SET ""FinishPos"" = sub.new_pos
        FROM (
            SELECT
                ""Id"",
                CASE
                    WHEN ""FinishTime"" = 0 THEN CAST(0 AS smallint)
                    ELSE CAST(
                        ROW_NUMBER() OVER (
                            PARTITION BY ""RoomId"", ""RaceNumber""
                            ORDER BY
                                CASE WHEN ""FinishTime"" = 0 THEN 1 ELSE 0 END ASC,
                                ""FinishTime"" ASC
                        )
                    AS smallint)
                END AS new_pos
            FROM ""RaceResults""
        ) AS sub
        WHERE rr.""Id"" = sub.""Id"";
    ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Original FinishPos values are not recoverable. Down is intentionally empty.
        }
    }
}
