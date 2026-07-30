using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddKartBikeRanksToPlayers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BikeRank",
                table: "Players",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "KartRank",
                table: "Players",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_BikeRank",
                table: "Players",
                column: "BikeRank");

            migrationBuilder.CreateIndex(
                name: "IX_Players_KartRank",
                table: "Players",
                column: "KartRank");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Players_BikeRank",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_KartRank",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "BikeRank",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "KartRank",
                table: "Players");
        }
    }
}
