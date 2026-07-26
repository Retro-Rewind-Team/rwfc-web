using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddIsBannedToPlayerRankIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Players_IsSuspicious_Ev_LastSeen",
                table: "Players");

            migrationBuilder.CreateIndex(
                name: "IX_Players_IsBanned_IsSuspicious_Ev_LastSeen",
                table: "Players",
                columns: new[] { "IsBanned", "IsSuspicious", "Ev", "LastSeen" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Players_IsBanned_IsSuspicious_Ev_LastSeen",
                table: "Players");

            migrationBuilder.CreateIndex(
                name: "IX_Players_IsSuspicious_Ev_LastSeen",
                table: "Players",
                columns: new[] { "IsSuspicious", "Ev", "LastSeen" });
        }
    }
}
