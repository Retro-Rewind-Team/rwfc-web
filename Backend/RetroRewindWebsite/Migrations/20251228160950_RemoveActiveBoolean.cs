using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class RemoveActiveBoolean : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Players_ActiveRank"";");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Players_IsActive"";");

            migrationBuilder.DropColumn(
                name: "ActiveRank",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Players");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActiveRank",
                table: "Players",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Players",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Players_ActiveRank",
                table: "Players",
                column: "ActiveRank");

            migrationBuilder.CreateIndex(
                name: "IX_Players_IsActive",
                table: "Players",
                column: "IsActive");
        }
    }
}