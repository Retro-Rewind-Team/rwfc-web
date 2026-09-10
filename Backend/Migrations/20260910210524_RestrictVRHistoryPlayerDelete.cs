using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class RestrictVRHistoryPlayerDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // IF EXISTS on both drops: rr_dev was found carrying neither the foreign key nor a
            // matching index, so this schema has drifted between databases before. A migration that
            // aborts on a missing object it was about to remove anyway helps nobody.
            migrationBuilder.Sql("""
                ALTER TABLE "VRHistories"
                    DROP CONSTRAINT IF EXISTS "FK_VRHistories_Players_PlayerId";
                """);

            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_VRHistories_PlayerId";""");

            // Deliberately NOT VALID, with no VALIDATE CONSTRAINT to follow it.
            //
            // Production carries no foreign key on this table at all -- it was dropped there at some
            // point, and 13,282 rows have since accumulated whose PlayerId matches no Players.Pid.
            // VALIDATE would fail on those, and because migrations run at app startup, a failure
            // here stops the application from starting after a deploy.
            //
            // NOT VALID is the right answer rather than a workaround: it adds in constant time on a
            // 9.6M row table, and Postgres still enforces the constraint on every insert and update
            // from here on. Only the pre-existing rows go unchecked. The sync creates VR history
            // solely for players it has already inserted (LeaderboardSyncService), and nothing in
            // the codebase deletes player rows, so no new orphan can be created.
            //
            // Once the existing orphans are dealt with, promoting this is one statement, and it
            // scans under SHARE UPDATE EXCLUSIVE, blocking neither reads nor writes:
            //   ALTER TABLE "VRHistories" VALIDATE CONSTRAINT "FK_VRHistories_Players_PlayerId";
            migrationBuilder.Sql("""
                ALTER TABLE "VRHistories"
                    ADD CONSTRAINT "FK_VRHistories_Players_PlayerId"
                    FOREIGN KEY ("PlayerId") REFERENCES "Players" ("Pid")
                    ON DELETE RESTRICT
                    NOT VALID;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Same NOT VALID treatment as Up, and for the same reason: the orphan rows that block
            // validation are still there on the way back down.
            migrationBuilder.Sql("""
                ALTER TABLE "VRHistories"
                    DROP CONSTRAINT IF EXISTS "FK_VRHistories_Players_PlayerId";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_VRHistories_PlayerId",
                table: "VRHistories",
                column: "PlayerId");

            migrationBuilder.Sql("""
                ALTER TABLE "VRHistories"
                    ADD CONSTRAINT "FK_VRHistories_Players_PlayerId"
                    FOREIGN KEY ("PlayerId") REFERENCES "Players" ("Pid")
                    ON DELETE SET NULL
                    NOT VALID;
                """);
        }
    }
}
