using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddRaceResultsIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_CharacterId",
                table: "RaceResults",
                column: "CharacterId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_CourseId_FinishTime",
                table: "RaceResults",
                columns: new[] { "CourseId", "FinishTime" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_ProfileId_CharacterId",
                table: "RaceResults",
                columns: new[] { "ProfileId", "CharacterId" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_ProfileId_CourseId",
                table: "RaceResults",
                columns: new[] { "ProfileId", "CourseId" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_ProfileId_RaceTimestamp",
                table: "RaceResults",
                columns: new[] { "ProfileId", "RaceTimestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_ProfileId_VehicleId",
                table: "RaceResults",
                columns: new[] { "ProfileId", "VehicleId" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_VehicleId",
                table: "RaceResults",
                column: "VehicleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RaceResults_CharacterId",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_CourseId_FinishTime",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_ProfileId_CharacterId",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_ProfileId_CourseId",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_ProfileId_RaceTimestamp",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_ProfileId_VehicleId",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_VehicleId",
                table: "RaceResults");
        }
    }
}
