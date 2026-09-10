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

            // VRHistories holds ~9.6M rows in production. A plain ADD FOREIGN KEY takes SHARE ROW
            // EXCLUSIVE on both tables and scans every row before it returns, which blocks writes to
            // VRHistories and Players for the length of the scan. Migrations run at app startup, so
            // that also holds the deploy. NOT VALID adds the constraint in constant time and still
            // enforces it on every new row; VALIDATE then does the scan under SHARE UPDATE
            // EXCLUSIVE, which blocks neither reads nor writes. The rows being validated were
            // already covered by the constraint dropped above, whose only difference is the ON
            // DELETE action, so the scan confirms what is already true.
            migrationBuilder.Sql("""
                ALTER TABLE "VRHistories"
                    ADD CONSTRAINT "FK_VRHistories_Players_PlayerId"
                    FOREIGN KEY ("PlayerId") REFERENCES "Players" ("Pid")
                    ON DELETE RESTRICT
                    NOT VALID;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "VRHistories"
                    VALIDATE CONSTRAINT "FK_VRHistories_Players_PlayerId";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Same NOT VALID treatment as Up, so a rollback is not a blocking operation either.
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

            migrationBuilder.Sql("""
                ALTER TABLE "VRHistories"
                    VALIDATE CONSTRAINT "FK_VRHistories_Players_PlayerId";
                """);
        }
    }
}
