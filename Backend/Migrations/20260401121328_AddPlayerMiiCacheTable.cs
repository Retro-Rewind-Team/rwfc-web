using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddPlayerMiiCacheTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Players_MiiImageFetchedAt_MiiData",
                table: "Players");

            migrationBuilder.CreateTable(
                name: "PlayerMiiCaches",
                columns: table => new
                {
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    MiiImageBase64 = table.Column<string>(type: "text", nullable: false),
                    MiiImageFetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerMiiCaches", x => x.PlayerId);
                    table.ForeignKey(
                        name: "FK_PlayerMiiCaches_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Copy existing cached Mii images from Players to the new table before dropping the columns
            migrationBuilder.Sql(@"
                INSERT INTO ""PlayerMiiCaches"" (""PlayerId"", ""MiiImageBase64"", ""MiiImageFetchedAt"")
                SELECT ""Id"", ""MiiImageBase64"", ""MiiImageFetchedAt""
                FROM ""Players""
                WHERE ""MiiImageBase64"" IS NOT NULL AND ""MiiImageFetchedAt"" IS NOT NULL
            ");

            migrationBuilder.DropColumn(
                name: "MiiImageBase64",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "MiiImageFetchedAt",
                table: "Players");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerMiiCaches_MiiImageFetchedAt",
                table: "PlayerMiiCaches",
                column: "MiiImageFetchedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            // Restore cached Mii images from the cache table back to Players before dropping it
            migrationBuilder.Sql(@"
                UPDATE ""Players"" p
                SET ""MiiImageBase64"" = c.""MiiImageBase64"",
                    ""MiiImageFetchedAt"" = c.""MiiImageFetchedAt""
                FROM ""PlayerMiiCaches"" c
                WHERE p.""Id"" = c.""PlayerId""
            ");

            migrationBuilder.DropTable(
                name: "PlayerMiiCaches");

            migrationBuilder.CreateIndex(
                name: "IX_Players_MiiImageFetchedAt_MiiData",
                table: "Players",
                columns: new[] { "MiiImageFetchedAt", "MiiData" },
                filter: "\"MiiData\" IS NOT NULL AND \"MiiData\" != ''");
        }
    }
}
