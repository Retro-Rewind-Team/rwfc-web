using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddShroomlessGlitch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Glitch",
                table: "GhostSubmissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Shroomless",
                table: "GhostSubmissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Glitch",
                table: "GhostSubmissions");

            migrationBuilder.DropColumn(
                name: "Shroomless",
                table: "GhostSubmissions");
        }
    }
}
