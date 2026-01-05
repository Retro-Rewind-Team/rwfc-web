using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddDriftCategoryAndGlitch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GhostSubmissions_TrackId_CC_FinishTimeMs_SubmittedAt",
                table: "GhostSubmissions");

            migrationBuilder.AddColumn<bool>(
                name: "SupportsGlitch",
                table: "Tracks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<short>(
                name: "DriftCategory",
                table: "GhostSubmissions",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_SupportsGlitch",
                table: "Tracks",
                column: "SupportsGlitch");

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TrackId_CC_Glitch",
                table: "GhostSubmissions",
                columns: new[] { "TrackId", "CC", "Glitch" });

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TrackId_CC_Glitch_FinishTimeMs_SubmittedAt",
                table: "GhostSubmissions",
                columns: new[] { "TrackId", "CC", "Glitch", "FinishTimeMs", "SubmittedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tracks_SupportsGlitch",
                table: "Tracks");

            migrationBuilder.DropIndex(
                name: "IX_GhostSubmissions_TrackId_CC_Glitch",
                table: "GhostSubmissions");

            migrationBuilder.DropIndex(
                name: "IX_GhostSubmissions_TrackId_CC_Glitch_FinishTimeMs_SubmittedAt",
                table: "GhostSubmissions");

            migrationBuilder.DropColumn(
                name: "SupportsGlitch",
                table: "Tracks");

            migrationBuilder.DropColumn(
                name: "DriftCategory",
                table: "GhostSubmissions");

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TrackId_CC_FinishTimeMs_SubmittedAt",
                table: "GhostSubmissions",
                columns: new[] { "TrackId", "CC", "FinishTimeMs", "SubmittedAt" });
        }
    }
}
