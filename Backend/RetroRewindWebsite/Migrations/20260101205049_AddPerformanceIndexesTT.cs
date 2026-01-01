using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexesTT : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TrackId_CC_DateSet",
                table: "GhostSubmissions",
                columns: new[] { "TrackId", "CC", "DateSet" });

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TrackId_CC_FinishTimeMs_SubmittedAt",
                table: "GhostSubmissions",
                columns: new[] { "TrackId", "CC", "FinishTimeMs", "SubmittedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GhostSubmissions_TrackId_CC_DateSet",
                table: "GhostSubmissions");

            migrationBuilder.DropIndex(
                name: "IX_GhostSubmissions_TrackId_CC_FinishTimeMs_SubmittedAt",
                table: "GhostSubmissions");
        }
    }
}
