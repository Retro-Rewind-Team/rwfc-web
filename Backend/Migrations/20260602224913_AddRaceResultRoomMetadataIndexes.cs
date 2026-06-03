using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddRaceResultRoomMetadataIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_IsPublic",
                table: "RaceResults",
                column: "IsPublic");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_Rk",
                table: "RaceResults",
                column: "Rk");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RaceResults_IsPublic",
                table: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_RaceResults_Rk",
                table: "RaceResults");
        }
    }
}
