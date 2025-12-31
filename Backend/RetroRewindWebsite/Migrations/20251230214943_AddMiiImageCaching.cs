using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddMiiImageCaching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MiiImageBase64",
                table: "Players",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "MiiImageFetchedAt",
                table: "Players",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MiiImageBase64",
                table: "LegacyPlayers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MiiImageBase64",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "MiiImageFetchedAt",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "MiiImageBase64",
                table: "LegacyPlayers");
        }
    }
}
