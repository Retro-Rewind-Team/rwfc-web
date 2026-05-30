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
            // Runs as a PostgreSQL procedure with 100 batched commits to avoid generating a single
            // massive WAL transaction and to keep pgsql_tmp sort spills small.
            // Batching uses hashtext(RoomId) % 100 so all rows for the same room (and thus the same
            // races) always land in the same batch, keeping the window function correct per batch.
            migrationBuilder.Sql(@"
                CREATE OR REPLACE PROCEDURE recalculate_finish_positions()
                LANGUAGE plpgsql
                AS $$
                DECLARE
                    batch_num INT;
                BEGIN
                    SET work_mem = '64MB';
                    FOR batch_num IN 0..99 LOOP
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
                            WHERE abs(hashtext(""RoomId"")::bigint) % 100 = batch_num
                        ) AS sub
                        WHERE rr.""Id"" = sub.""Id"";
                        COMMIT;
                    END LOOP;
                END;
                $$;
            ", suppressTransaction: true);

            migrationBuilder.Sql("CALL recalculate_finish_positions();", suppressTransaction: true);
            migrationBuilder.Sql("DROP PROCEDURE recalculate_finish_positions();", suppressTransaction: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Original FinishPos values are not recoverable. Down is intentionally empty.
        }
    }
}
