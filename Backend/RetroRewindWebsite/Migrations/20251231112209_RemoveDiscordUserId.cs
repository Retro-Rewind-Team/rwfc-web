using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDiscordUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TTProfiles_DiscordUserId",
                table: "TTProfiles");

            migrationBuilder.DropIndex(
                name: "IX_GhostSubmissions_SubmittedByDiscordId",
                table: "GhostSubmissions");

            migrationBuilder.DropColumn(
                name: "DiscordUserId",
                table: "TTProfiles");

            migrationBuilder.DropColumn(
                name: "SubmittedByDiscordId",
                table: "GhostSubmissions");

            migrationBuilder.CreateIndex(
                name: "IX_TTProfiles_DisplayName",
                table: "TTProfiles",
                column: "DisplayName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TTProfiles_DisplayName",
                table: "TTProfiles");

            migrationBuilder.AddColumn<string>(
                name: "DiscordUserId",
                table: "TTProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SubmittedByDiscordId",
                table: "GhostSubmissions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_TTProfiles_DiscordUserId",
                table: "TTProfiles",
                column: "DiscordUserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_SubmittedByDiscordId",
                table: "GhostSubmissions",
                column: "SubmittedByDiscordId");
        }
    }
}
