using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using RetroRewindWebsite.Data;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    [DbContext(typeof(LeaderboardDbContext))]
    [Migration("20251209000000_InitialCreate")]
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Pid = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Fc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Ev = table.Column<int>(type: "integer", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    ActiveRank = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsSuspicious = table.Column<bool>(type: "boolean", nullable: false),
                    SuspiciousVRJumps = table.Column<int>(type: "integer", nullable: false),
                    MiiData = table.Column<string>(type: "text", nullable: false),
                    LastSeen = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VRGainLast24Hours = table.Column<int>(type: "integer", nullable: false),
                    VRGainLastMonth = table.Column<int>(type: "integer", nullable: false),
                    VRGainLastWeek = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Players_Pid",
                table: "Players",
                column: "Pid",
                unique: true);

            migrationBuilder.CreateTable(
                name: "VRHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PlayerId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Fc = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TotalVR = table.Column<int>(type: "integer", nullable: false),
                    VRChange = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VRHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VRHistories_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Pid",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Players_ActiveRank",
                table: "Players",
                column: "ActiveRank");

            migrationBuilder.CreateIndex(
                name: "IX_Players_Fc",
                table: "Players",
                column: "Fc");

            migrationBuilder.CreateIndex(
                name: "IX_Players_IsActive",
                table: "Players",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Players_IsSuspicious",
                table: "Players",
                column: "IsSuspicious");

            migrationBuilder.CreateIndex(
                name: "IX_Players_LastSeen",
                table: "Players",
                column: "LastSeen");

            migrationBuilder.CreateIndex(
                name: "IX_Players_Rank",
                table: "Players",
                column: "Rank");

            migrationBuilder.CreateIndex(
                name: "IX_VRHistories_Date",
                table: "VRHistories",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_VRHistories_PlayerId",
                table: "VRHistories",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_VRHistories_PlayerId_Date",
                table: "VRHistories",
                columns: new[] { "PlayerId", "Date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "VRHistories");
            migrationBuilder.DropTable(name: "Players");
        }
    }
}
