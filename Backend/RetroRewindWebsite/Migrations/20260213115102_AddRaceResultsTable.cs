using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class AddRaceResultsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tracks_CourseId",
                table: "Tracks");

            migrationBuilder.AddColumn<short>(
                name: "SlotId",
                table: "Tracks",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.CreateTable(
                name: "RaceResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoomId = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    RaceNumber = table.Column<int>(type: "integer", nullable: false),
                    RaceTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProfileId = table.Column<long>(type: "bigint", nullable: false),
                    PlayerId = table.Column<int>(type: "integer", nullable: false),
                    FinishTime = table.Column<int>(type: "integer", nullable: false),
                    CharacterId = table.Column<short>(type: "smallint", nullable: false),
                    VehicleId = table.Column<short>(type: "smallint", nullable: false),
                    PlayerCount = table.Column<short>(type: "smallint", nullable: false),
                    FinishPos = table.Column<short>(type: "smallint", nullable: false),
                    FramesIn1st = table.Column<int>(type: "integer", nullable: false),
                    CourseId = table.Column<short>(type: "smallint", nullable: false),
                    EngineClassId = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceResults", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_SlotId",
                table: "Tracks",
                column: "SlotId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_CourseId",
                table: "RaceResults",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_CourseId_EngineClassId",
                table: "RaceResults",
                columns: new[] { "CourseId", "EngineClassId" });

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_ProfileId",
                table: "RaceResults",
                column: "ProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RaceTimestamp",
                table: "RaceResults",
                column: "RaceTimestamp");

            migrationBuilder.CreateIndex(
                name: "IX_RaceResults_RoomId_RaceNumber_ProfileId",
                table: "RaceResults",
                columns: new[] { "RoomId", "RaceNumber", "ProfileId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RaceResults");

            migrationBuilder.DropIndex(
                name: "IX_Tracks_SlotId",
                table: "Tracks");

            migrationBuilder.DropColumn(
                name: "SlotId",
                table: "Tracks");

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_CourseId",
                table: "Tracks",
                column: "CourseId");
        }
    }
}
