using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/staff/iot"),Authorize(Roles=$"{RoleNames.Staff},{RoleNames.Admin}")]
public class IoTManagementController(IoTManagementService service):ControllerBase
{
    private int UserId=>int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet("devices")] public async Task<IActionResult> Devices([FromQuery]QueryRequest query,[FromQuery]string? status)=>Ok(ApiResponse<object>.Ok(await service.DevicesAsync(query,status)));
    [HttpGet("devices/{id:int}")] public async Task<IActionResult> Device(int id)=>Ok(ApiResponse<object>.Ok(await service.DeviceAsync(id)));
    [HttpGet("devices/{id:int}/latest")] public async Task<IActionResult> LatestTelemetry(int id)=>Ok(ApiResponse<object>.Ok(await service.LatestTelemetryAsync(id)));
    [HttpPost("devices")] public async Task<IActionResult> CreateDevice(IoTDeviceRequest request)=>StatusCode(201,ApiResponse<object>.Ok(await service.CreateDeviceAsync(request),"IoT device created"));
    [HttpPut("devices/{id:int}")] public async Task<IActionResult> UpdateDevice(int id,IoTDeviceRequest request)=>Ok(ApiResponse<object>.Ok(await service.UpdateDeviceAsync(id,request)));
    [HttpPut("devices/{id:int}/status")] public async Task<IActionResult> UpdateStatus(int id,DeviceStatusRequest request)=>Ok(ApiResponse<object>.Ok(await service.UpdateStatusAsync(id,request)));
    [HttpDelete("devices/{id:int}")] public async Task<IActionResult> DeactivateDevice(int id){await service.DeactivateDeviceAsync(id);return Ok(ApiResponse<object>.Ok(new{},"IoT device deactivated"));}

    [HttpGet("tray-devices")] public async Task<IActionResult> TrayDevices([FromQuery]int? soilTrayId,[FromQuery]bool? active)=>Ok(ApiResponse<object>.Ok(await service.TrayDevicesAsync(soilTrayId,active)));
    [HttpPost("tray-devices")] public async Task<IActionResult> Assign(AssignTrayDeviceRequest request)=>StatusCode(201,ApiResponse<object>.Ok(await service.AssignAsync(request),"Device assigned"));
    [HttpDelete("tray-devices/{id:int}")] public async Task<IActionResult> Unassign(int id)=>Ok(ApiResponse<object>.Ok(await service.DeactivateAssignmentAsync(id),"Device assignment deactivated"));

    [HttpPost("camera-snapshots")] public async Task<IActionResult> AddSnapshot(CameraSnapshotRequest request)=>StatusCode(201,ApiResponse<object>.Ok(await service.AddSnapshotAsync(request),"Camera snapshot metadata created"));
    [HttpGet("camera-snapshots")] public async Task<IActionResult> Snapshots([FromQuery]QueryRequest query,[FromQuery]int? rentalId,[FromQuery]int? deviceId)=>Ok(ApiResponse<object>.Ok(await service.SnapshotsAsync(query,rentalId,deviceId)));
    [HttpGet("actuator-logs")] public async Task<IActionResult> ActuatorLogs([FromQuery]QueryRequest query,[FromQuery]int? deviceId,[FromQuery]string? result,[FromQuery]DateTime? from,[FromQuery]DateTime? to)=>Ok(ApiResponse<object>.Ok(await service.ActuatorLogsAsync(query,deviceId,result,from,to)));
    [HttpPost("devices/{id:int}/actuator-commands")] public async Task<IActionResult> ActuatorCommand(int id,ActuatorCommandRequest request,CancellationToken cancellationToken)=>StatusCode(202,ApiResponse<object>.Ok(await service.ActuatorCommandAsync(id,UserId,request,cancellationToken),"Actuator command published"));
    [HttpGet("actuator-commands/{commandId}")] public async Task<IActionResult> ActuatorCommand(string commandId)=>Ok(ApiResponse<object>.Ok(await service.ActuatorCommandAsync(commandId)));
    [HttpGet("alerts")] public async Task<IActionResult> Alerts([FromQuery]QueryRequest query,[FromQuery]bool? resolved,[FromQuery]string? severity,[FromQuery]int? deviceId)=>Ok(ApiResponse<object>.Ok(await service.AlertsAsync(query,resolved,severity,deviceId)));
    [HttpPatch("alerts/{id:int}/resolve")] public async Task<IActionResult> Resolve(int id,ResolveAlertRequest request)=>Ok(ApiResponse<object>.Ok(await service.ResolveAlertAsync(id,request.IsResolved)));
}

/// <summary>
/// Nhận ảnh từ ESP32-CAM. Thiết bị KHÔNG có JWT nên xác thực bằng header X-Device-Key
/// (so với MqttOptions.IngestApiKey — cùng key thiết bị đã dùng cho telemetry).
/// Route: POST /api/v1/iot/camera-snapshots/upload  (multipart/form-data: file + deviceId + rentalId).
/// </summary>
[ApiController,ApiVersion(1.0),Route("api/v{version:apiVersion}/iot")]
public class CameraIngestController(IoTManagementService service,MqttOptions mqtt,IWebHostEnvironment env,IConfiguration config):ControllerBase
{
    private static readonly HashSet<string> AllowedExt = new(StringComparer.OrdinalIgnoreCase){".jpg",".jpeg",".png",".webp"};

    private void AuthorizeDevice()
    {
        var supplied=Request.Headers["X-Device-Key"].ToString();
        if(string.IsNullOrWhiteSpace(mqtt.IngestApiKey)||!CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(supplied),Encoding.UTF8.GetBytes(mqtt.IngestApiKey)))
            throw new AppException(401,"Invalid device API key.");
    }

    [HttpPost("camera-snapshots/upload")]
    [AllowAnonymous]
    [RequestSizeLimit(10_485_760)] // trần cứng 10MB ở tầng request; giới hạn mềm đọc từ config bên dưới
    public async Task<IActionResult> Upload([FromForm]CameraSnapshotUploadForm form,IFormFile file)
    {
        AuthorizeDevice();
        if(file is null||file.Length==0)throw new AppException(400,"Image file is required.");

        var maxBytes=config.GetValue<long?>("Camera:MaxFileSizeBytes")??5_242_880;
        if(file.Length>maxBytes)throw new AppException(413,$"Image exceeds max size ({maxBytes} bytes).");

        var ext=Path.GetExtension(file.FileName);
        if(string.IsNullOrWhiteSpace(ext)||!AllowedExt.Contains(ext))
            throw new AppException(415,"Unsupported image type. Allowed: jpg, jpeg, png, webp.");

        await using var ms=new MemoryStream();
        await file.CopyToAsync(ms);

        var webRoot=string.IsNullOrWhiteSpace(env.WebRootPath)?Path.Combine(env.ContentRootPath,"wwwroot"):env.WebRootPath;
        var physicalDir=Path.Combine(webRoot,"uploads","snapshots");
        var publicBase=config["Camera:PublicBaseUrl"]??$"{Request.Scheme}://{Request.Host}";

        var dto=await service.AddSnapshotFromUploadAsync(
            form.DeviceId,form.RentalId,form.TakenAt,ms.ToArray(),ext,physicalDir,publicBase);
        return StatusCode(201,ApiResponse<object>.Ok(dto,"Camera snapshot uploaded"));
    }
}
