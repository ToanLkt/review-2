using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFarm.Repositories.Migrations
{
    /// <inheritdoc />
    public partial class AddMqttTelemetryIngestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MessageId",
                table: "SensorTelemetry",
                type: "varchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<float>(
                name: "WaterLevel",
                table: "SensorTelemetry",
                type: "float",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE SensorTelemetry SET MessageId = CONCAT('legacy-', TelemetryId) WHERE MessageId = '';");

            migrationBuilder.CreateIndex(
                name: "IX_SensorTelemetry_MessageId",
                table: "SensorTelemetry",
                column: "MessageId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SensorTelemetry_MessageId",
                table: "SensorTelemetry");

            migrationBuilder.DropColumn(
                name: "MessageId",
                table: "SensorTelemetry");

            migrationBuilder.DropColumn(
                name: "WaterLevel",
                table: "SensorTelemetry");
        }
    }
}
