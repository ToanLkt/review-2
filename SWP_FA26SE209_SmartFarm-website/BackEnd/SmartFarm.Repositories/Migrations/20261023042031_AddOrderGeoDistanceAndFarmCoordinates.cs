using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFarm.Repositories.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderGeoDistanceAndFarmCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DeliveryDistanceKm",
                table: "Orders",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ShippingLatitude",
                table: "Orders",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ShippingLongitude",
                table: "Orders",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "FarmLatitude",
                table: "FarmConfigs",
                type: "double",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "FarmLongitude",
                table: "FarmConfigs",
                type: "double",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryDistanceKm",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShippingLatitude",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShippingLongitude",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "FarmLatitude",
                table: "FarmConfigs");

            migrationBuilder.DropColumn(
                name: "FarmLongitude",
                table: "FarmConfigs");
        }
    }
}
