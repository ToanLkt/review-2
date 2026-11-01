using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFarm.Repositories.Migrations
{
    /// <inheritdoc />
    public partial class AutomateInventoryMovementsAndAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SystemAlerts_IoTDevices_DeviceId",
                table: "SystemAlerts");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialMovements_OrderId_SupplyId_MovementType",
                table: "MaterialMovements",
                columns: new[] { "OrderId", "SupplyId", "MovementType" },
                unique: true);

            migrationBuilder.DropIndex(
                name: "IX_MaterialMovements_OrderId",
                table: "MaterialMovements");

            migrationBuilder.AlterColumn<int>(
                name: "DeviceId",
                table: "SystemAlerts",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "SupplyId",
                table: "SystemAlerts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemAlerts_SupplyId",
                table: "SystemAlerts",
                column: "SupplyId");

            migrationBuilder.AddForeignKey(
                name: "FK_SystemAlerts_IoTDevices_DeviceId",
                table: "SystemAlerts",
                column: "DeviceId",
                principalTable: "IoTDevices",
                principalColumn: "DeviceId");

            migrationBuilder.AddForeignKey(
                name: "FK_SystemAlerts_Supplies_SupplyId",
                table: "SystemAlerts",
                column: "SupplyId",
                principalTable: "Supplies",
                principalColumn: "SupplyId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SystemAlerts_IoTDevices_DeviceId",
                table: "SystemAlerts");

            migrationBuilder.DropForeignKey(
                name: "FK_SystemAlerts_Supplies_SupplyId",
                table: "SystemAlerts");

            migrationBuilder.DropIndex(
                name: "IX_SystemAlerts_SupplyId",
                table: "SystemAlerts");

            migrationBuilder.DropIndex(
                name: "IX_MaterialMovements_OrderId_SupplyId_MovementType",
                table: "MaterialMovements");

            migrationBuilder.DropColumn(
                name: "SupplyId",
                table: "SystemAlerts");

            migrationBuilder.AlterColumn<int>(
                name: "DeviceId",
                table: "SystemAlerts",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MaterialMovements_OrderId",
                table: "MaterialMovements",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_SystemAlerts_IoTDevices_DeviceId",
                table: "SystemAlerts",
                column: "DeviceId",
                principalTable: "IoTDevices",
                principalColumn: "DeviceId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
