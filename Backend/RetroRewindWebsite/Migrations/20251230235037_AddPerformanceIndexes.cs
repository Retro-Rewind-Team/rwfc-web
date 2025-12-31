using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Players_IsSuspicious_Ev_LastSeen",
                table: "Players",
                columns: new[] { "IsSuspicious", "Ev", "LastSeen" });

            migrationBuilder.CreateIndex(
                name: "IX_Players_MiiImageFetchedAt_MiiData",
                table: "Players",
                columns: new[] { "MiiImageFetchedAt", "MiiData" },
                filter: "\"MiiData\" IS NOT NULL AND \"MiiData\" != ''");

            migrationBuilder.CreateIndex(
                name: "IX_Players_VRGainLast24Hours",
                table: "Players",
                column: "VRGainLast24Hours");

            migrationBuilder.CreateIndex(
                name: "IX_Players_VRGainLastMonth",
                table: "Players",
                column: "VRGainLastMonth");

            migrationBuilder.CreateIndex(
                name: "IX_Players_VRGainLastWeek",
                table: "Players",
                column: "VRGainLastWeek");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Players_IsSuspicious_Ev_LastSeen",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_MiiImageFetchedAt_MiiData",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_VRGainLast24Hours",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_VRGainLastMonth",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_VRGainLastWeek",
                table: "Players");
        }
    }
}
