using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTrackSlot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tracks_SlotId",
                table: "Tracks");

            migrationBuilder.DropIndex(
                name: "IX_Tracks_TrackSlot",
                table: "Tracks");

            migrationBuilder.DropColumn(
                name: "SlotId",
                table: "Tracks");

            migrationBuilder.DropColumn(
                name: "TrackSlot",
                table: "Tracks");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<short>(
                name: "SlotId",
                table: "Tracks",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.AddColumn<string>(
                name: "TrackSlot",
                table: "Tracks",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_SlotId",
                table: "Tracks",
                column: "SlotId");

            migrationBuilder.CreateIndex(
                name: "IX_Tracks_TrackSlot",
                table: "Tracks",
                column: "TrackSlot");
        }
    }
}
