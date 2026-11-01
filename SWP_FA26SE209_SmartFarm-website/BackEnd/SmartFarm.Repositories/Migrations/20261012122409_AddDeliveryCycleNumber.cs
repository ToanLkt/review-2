using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFarm.Repositories.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryCycleNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CycleNumber",
                table: "Deliveries",
                type: "int",
                nullable: false,
                defaultValue: 1);

            // Tạo index tổ hợp (OrderId, CycleNumber) TRƯỚC: MySQL sẽ dùng index này cho FK OrderId
            // (vì OrderId là cột dẫn đầu), nhờ đó mới drop được index đơn IX_Deliveries_OrderId.
            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_OrderId_CycleNumber",
                table: "Deliveries",
                columns: new[] { "OrderId", "CycleNumber" },
                unique: true);

            migrationBuilder.DropIndex(
                name: "IX_Deliveries_OrderId",
                table: "Deliveries");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Deliveries_OrderId_CycleNumber",
                table: "Deliveries");

            migrationBuilder.DropColumn(
                name: "CycleNumber",
                table: "Deliveries");

            migrationBuilder.CreateIndex(
                name: "IX_Deliveries_OrderId",
                table: "Deliveries",
                column: "OrderId",
                unique: true);
        }
    }
}
