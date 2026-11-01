using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFarm.Repositories.Migrations
{
    /// <inheritdoc />
    public partial class AddCartItemTotalCycles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalCycles",
                table: "CartItems",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalCycles",
                table: "CartItems");
        }
    }
}
