using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

// Admin đọc/sửa cấu hình trang trại (1 bản ghi cố định).
[ApiController, ApiVersion(1.0), Route("api/v{version:apiVersion}/admin/farm-config")]
[Authorize(Roles = RoleNames.Admin)]
[Produces("application/json")]
public class FarmConfigController(FarmConfigService service) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> Get() => Ok(ApiResponse<object>.Ok(await service.GetAsync()));
    [HttpPut] public async Task<IActionResult> Update(UpdateFarmConfigRequest request) =>
        Ok(ApiResponse<object>.Ok(await service.UpdateAsync(request), "Farm config updated"));
}

// Thông tin trang trại công khai cho FE hiển thị (tên farm, kích thước khay chuẩn, số ngày đặt trước, bán kính giao).
[ApiController, ApiVersion(1.0), Route("api/v{version:apiVersion}/farm-info")]
[Produces("application/json")]
public class PublicFarmInfoController(FarmConfigService service) : ControllerBase
{
    [AllowAnonymous, HttpGet]
    public async Task<IActionResult> Info() => Ok(ApiResponse<object>.Ok(await service.PublicInfoAsync()));
}
