using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddLegacyPlayers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LegacyPlayers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Pid = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Fc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Ev = table.Column<int>(type: "integer", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    IsSuspicious = table.Column<bool>(type: "boolean", nullable: false),
                    MiiData = table.Column<string>(type: "text", nullable: false),
                    SnapshotDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegacyPlayers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LegacyPlayers_Fc",
                table: "LegacyPlayers",
                column: "Fc");

            migrationBuilder.CreateIndex(
                name: "IX_LegacyPlayers_IsSuspicious",
                table: "LegacyPlayers",
                column: "IsSuspicious");

            migrationBuilder.CreateIndex(
                name: "IX_LegacyPlayers_Pid",
                table: "LegacyPlayers",
                column: "Pid");

            migrationBuilder.CreateIndex(
                name: "IX_LegacyPlayers_Rank",
                table: "LegacyPlayers",
                column: "Rank");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LegacyPlayers");
        }
    }
}
