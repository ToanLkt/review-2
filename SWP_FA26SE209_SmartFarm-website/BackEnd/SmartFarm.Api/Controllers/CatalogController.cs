using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/seed-varieties")]
[Produces("application/json", "application/xml")]
public class SeedVarietiesController(ICatalogService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> List([FromQuery] QueryRequest query)
        => Ok(ApiResponse<PagedResponse<object>>.Ok(await service.SeedVarietiesAsync(query)));

    [HttpGet("{id:int}", Name = "GetSeedVarietyById")]
    public async Task<ActionResult<ApiResponse<SeedVarietyResponse>>> Detail(int id)
        => Ok(ApiResponse<SeedVarietyResponse>.Ok(await service.SeedVarietyAsync(id)));
}

[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}")]
[Produces("application/json", "application/xml")]
public class TraysController(ICatalogService service) : ControllerBase
{
    [HttpGet("trays/available")]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> Available(
        [FromQuery] QueryRequest query, [FromQuery] int? farmAreaId)
        => Ok(ApiResponse<PagedResponse<object>>.Ok(await service.AvailableTraysAsync(query, farmAreaId)));

    [HttpGet("farm-areas/{farmAreaId:int}/trays")]
    public async Task<ActionResult<ApiResponse<PagedResponse<object>>>> ByFarmArea(
        int farmAreaId, [FromQuery] QueryRequest query)
        => Ok(ApiResponse<PagedResponse<object>>.Ok(await service.AvailableTraysAsync(query, farmAreaId)));

    [HttpGet("trays/available/count")]
    public async Task<ActionResult<ApiResponse<object>>> AvailableCount([FromQuery] int? farmAreaId)
        => Ok(ApiResponse<object>.Ok(new { available = await service.AvailableTrayCountAsync(farmAreaId) }));

    // Danh sách khu vực trồng + thống kê sức chứa/khay trống (cho Customer chọn khi thuê).
    [HttpGet("farm-areas")]
    public async Task<ActionResult<ApiResponse<object>>> FarmAreas()
        => Ok(ApiResponse<object>.Ok(await service.FarmAreasAsync()));
}

// Preview khoảng cách + bán kính giao TRƯỚC khi tạo đơn, để FE báo trước phí/ngoài vùng.
// Public (khách chưa đăng nhập vẫn xem được khi đang chọn địa chỉ). Không tạo order, không ghi DB.
[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/delivery")]
[Produces("application/json", "application/xml")]
public class DeliveryPreviewController(DeliveryPricingService pricing) : ControllerBase
{
    [HttpGet("preview")]
    public async Task<ActionResult<ApiResponse<DeliveryPreviewResponse>>> Preview(
        [FromQuery] double? lat, [FromQuery] double? lng,
        [FromQuery] double? shippingLatitude, [FromQuery] double? shippingLongitude)
    {
        var targetLat = lat ?? shippingLatitude;
        var targetLng = lng ?? shippingLongitude;
        return Ok(ApiResponse<DeliveryPreviewResponse>.Ok(await pricing.PreviewAsync(targetLat, targetLng)));
    }
}
