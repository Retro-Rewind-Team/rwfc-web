using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomMetadataToRaceResults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "RaceResults",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Rk",
                table: "RaceResults",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "RaceResults");

            migrationBuilder.DropColumn(
                name: "Rk",
                table: "RaceResults");
        }
    }
}
