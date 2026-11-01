using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFarm.Repositories.Migrations
{
    /// <inheritdoc />
    public partial class AddActuatorStateToTelemetry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "FanState",
                table: "SensorTelemetry",
                type: "tinyint(1)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LedState",
                table: "SensorTelemetry",
                type: "tinyint(1)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PumpState",
                table: "SensorTelemetry",
                type: "tinyint(1)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FanState",
                table: "SensorTelemetry");

            migrationBuilder.DropColumn(
                name: "LedState",
                table: "SensorTelemetry");

            migrationBuilder.DropColumn(
                name: "PumpState",
                table: "SensorTelemetry");
        }
    }
}
