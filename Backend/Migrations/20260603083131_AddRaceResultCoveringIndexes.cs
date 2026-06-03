using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddRaceResultCoveringIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_CourseId_RoomId_RaceNumber_PlayerId0",
                table: "RaceResults",
                columns: new[] { "CourseId", "RoomId", "RaceNumber" },
                filter: "\"PlayerId\" = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RaceResults_CourseId_RoomId_RaceNumber_PlayerId0",
                table: "RaceResults");
        }
    }
}
