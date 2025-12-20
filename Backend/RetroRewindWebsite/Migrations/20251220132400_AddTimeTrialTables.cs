using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeTrialTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tracks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TrackSlot = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CourseId = table.Column<short>(type: "smallint", nullable: false),
                    Category = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Laps = table.Column<short>(type: "smallint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tracks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TTProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DiscordUserId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalSubmissions = table.Column<int>(type: "integer", nullable: false),
                    CurrentWorldRecords = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TTProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GhostSubmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TrackId = table.Column<int>(type: "integer", nullable: false),
                    TTProfileId = table.Column<int>(type: "integer", nullable: false),
                    CC = table.Column<short>(type: "smallint", nullable: false),
                    FinishTimeMs = table.Column<int>(type: "integer", nullable: false),
                    FinishTimeDisplay = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VehicleId = table.Column<short>(type: "smallint", nullable: false),
                    CharacterId = table.Column<short>(type: "smallint", nullable: false),
                    ControllerType = table.Column<short>(type: "smallint", nullable: false),
                    DriftType = table.Column<short>(type: "smallint", nullable: false),
                    MiiName = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    LapCount = table.Column<short>(type: "smallint", nullable: false),
                    LapSplitsMs = table.Column<string>(type: "jsonb", nullable: false),
                    GhostFilePath = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    DateSet = table.Column<DateOnly>(type: "date", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SubmittedByDiscordId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GhostSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GhostSubmissions_TTProfiles_TTProfileId",
                        column: x => x.TTProfileId,
                        principalTable: "TTProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GhostSubmissions_Tracks_TrackId",
                        column: x => x.TrackId,
                        principalTable: "Tracks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_SubmittedAt",
                table: "GhostSubmissions",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_SubmittedByDiscordId",
                table: "GhostSubmissions",
                column: "SubmittedByDiscordId");

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TrackId",
                table: "GhostSubmissions",
                column: "TrackId");

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TrackId_CC",
                table: "GhostSubmissions",
                columns: new[] { "TrackId", "CC" });

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TrackId_CC_FinishTimeMs",
                table: "GhostSubmissions",
                columns: new[] { "TrackId", "CC", "FinishTimeMs" });

            migrationBuilder.CreateIndex(
                name: "IX_GhostSubmissions_TTProfileId",
                table: "GhostSubmissions",
                column: "TTProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_Category",
                table: "Tracks",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_CourseId",
                table: "Tracks",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_TrackSlot",
                table: "Tracks",
                column: "TrackSlot");

            migrationBuilder.CreateIndex(
                name: "IX_TTProfiles_DiscordUserId",
                table: "TTProfiles",
                column: "DiscordUserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GhostSubmissions");

            migrationBuilder.DropTable(
                name: "TTProfiles");

            migrationBuilder.DropTable(
                name: "Tracks");
        }
    }
}
