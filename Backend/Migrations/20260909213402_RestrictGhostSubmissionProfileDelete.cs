using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetroRewindWebsite.Migrations
{
    /// <inheritdoc />
    public partial class RestrictGhostSubmissionProfileDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GhostSubmissions_TTProfiles_TTProfileId",
                table: "GhostSubmissions");

            migrationBuilder.AddForeignKey(
                name: "FK_GhostSubmissions_TTProfiles_TTProfileId",
                table: "GhostSubmissions",
                column: "TTProfileId",
                principalTable: "TTProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GhostSubmissions_TTProfiles_TTProfileId",
                table: "GhostSubmissions");

            migrationBuilder.AddForeignKey(
                name: "FK_GhostSubmissions_TTProfiles_TTProfileId",
                table: "GhostSubmissions",
                column: "TTProfileId",
                principalTable: "TTProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
