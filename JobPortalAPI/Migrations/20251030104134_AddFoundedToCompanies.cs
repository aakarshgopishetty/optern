using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace db_apis.Migrations
{
    /// <inheritdoc />
    public partial class AddFoundedToCompanies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Founded",
                table: "Companies",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Founded",
                table: "Companies");
        }
    }
}
