using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <summary>
    /// Drops five indexes on RaceResults that the production planner had never chosen.
    /// </summary>
    /// <remarks>
    /// From pg_stat_user_indexes on 2026-09-11, against a 558MB table carrying roughly 2.2GB of
    /// indexes. Scans since the last statistics reset:
    ///
    ///   IX_RaceResults_ProfileId_CharacterId    0 scans    77MB
    ///   IX_RaceResults_IsPublic                 0 scans    57MB
    ///   IX_RaceResults_Rk                       0 scans    57MB
    ///   IX_RaceResults_CharacterId              0 scans    55MB
    ///   IX_RaceResults_VehicleId                0 scans    55MB
    ///
    /// CharacterId and VehicleId are only ever grouped by, never filtered on, so a btree cannot
    /// help the hash aggregate. IsPublic is a boolean and Rk holds a handful of values, so both
    /// match nearly every row. ProfileId_CharacterId looked plausible but has no equivalent of
    /// the vehicle preference job that makes ProfileId_VehicleId the busiest index on the table.
    ///
    /// Deliberately not dropped, despite also reporting 0 scans:
    ///   IX_RaceResults_CourseId_FinishTime    0 scans   176MB
    /// It serves GetTrackOnlineBestsAsync, whose only caller is the Online Bests page, currently
    /// unrouted. Its zero reflects a parked feature, not a useless index.
    ///
    /// Two that static reading suggested were redundant and the counts proved otherwise, kept:
    ///   IX_RaceResults_ProfileId              365,902 scans    68MB
    ///   IX_RaceResults_ProfileId_VehicleId    574,302 scans    76MB
    ///
    /// DROP INDEX takes a brief ACCESS EXCLUSIVE lock but performs no scan, so these are quick
    /// even at this size.
    /// </remarks>

    public partial class DropUnusedRaceResultIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RaceResults_CharacterId",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_IsPublic",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_ProfileId_CharacterId",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_Rk",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_VehicleId",
                table: "RaceResults");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_CharacterId",
                table: "RaceResults",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_IsPublic",
                table: "RaceResults",
                column: "IsPublic");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_ProfileId_CharacterId",
                table: "RaceResults",
                columns: new[] { "ProfileId", "CharacterId" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_Rk",
                table: "RaceResults",
                column: "Rk");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_VehicleId",
                table: "RaceResults",
                column: "VehicleId");
        }
    }
}
