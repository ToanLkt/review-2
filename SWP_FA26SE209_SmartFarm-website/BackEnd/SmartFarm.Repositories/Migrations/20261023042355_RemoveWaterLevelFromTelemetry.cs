using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFarm.Repositories.Migrations
{
    /// <inheritdoc />
    public partial class RemoveWaterLevelFromTelemetry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WaterLevel",
                table: "SensorTelemetry");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "WaterLevel",
                table: "SensorTelemetry",
                type: "float",
                nullable: true);
        }
    }
}
