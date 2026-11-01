using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public sealed class IoTManagementService(
    AppDbContext db,
    IActuatorCommandPublisher? commandPublisher = null,
    CloudflareR2Options? r2Options = null,
    HttpClient? httpClient = null)
{
    private static readonly HttpClient FallbackHttpClient = new() { Timeout = TimeSpan.FromSeconds(30) };
    private static readonly TimeSpan TelemetryStaleAfter=TimeSpan.FromMinutes(5);
    public async Task<PagedResponse<object>> DevicesAsync(QueryRequest request,string? status)
    {
        var query=db.IoTDevices.AsNoTracking().AsQueryable();
        if(!string.IsNullOrWhiteSpace(status))query=query.Where(x=>x.Status==NormalizeDeviceStatus(status));
        if(!string.IsNullOrWhiteSpace(request.Search))query=query.Where(x=>x.DeviceCode.Contains(request.Search)||(x.MacAddress??"").Contains(request.Search));
        var (page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();var rows=await query.OrderBy(x=>x.DeviceCode).Skip((page-1)*size).Take(size).ToListAsync();
        return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }
    public async Task<IoTDeviceResponse> DeviceAsync(int id)=>ToDto(await FindDeviceAsync(id));
    public async Task<TelemetryResponse> LatestTelemetryAsync(int deviceId)
    {
        await FindDeviceAsync(deviceId);
        var x=await db.SensorTelemetry.AsNoTracking().Include(t=>t.Device).Where(t=>t.DeviceId==deviceId).OrderByDescending(t=>t.RecordedAt).FirstOrDefaultAsync()??throw new AppException(404,"Telemetry not found for this device.");
        return new TelemetryResponse(x.TelemetryId,x.MessageId,x.DeviceId,x.Device?.DeviceCode??"",x.SoilTrayId,x.Temperature,x.AirHumidity,x.SoilHumidity,x.LightIntensity,x.FanState,x.LedState,x.PumpState,x.RecordedAt,DateTime.UtcNow-x.RecordedAt>TelemetryStaleAfter);
    }
    public async Task<IoTDeviceResponse> CreateDeviceAsync(IoTDeviceRequest request)
    {
        await EnsureDeviceUniqueAsync(request.DeviceCode,request.MacAddress,null);var item=new IoTDevice();Apply(item,request);db.Add(item);await db.SaveChangesAsync();return ToDto(item);
    }
    public async Task<IoTDeviceResponse> UpdateDeviceAsync(int id,IoTDeviceRequest request)
    {
        var item=await FindDeviceAsync(id);await EnsureDeviceUniqueAsync(request.DeviceCode,request.MacAddress,id);Apply(item,request);await db.SaveChangesAsync();return ToDto(item);
    }
    public async Task<IoTDeviceResponse> UpdateStatusAsync(int id,DeviceStatusRequest request)
    {
        var item=await FindDeviceAsync(id);item.Status=NormalizeDeviceStatus(request.Status);item.LastSeen=request.LastSeen?.ToUniversalTime()??DateTime.UtcNow;await db.SaveChangesAsync();return ToDto(item);
    }
    public async Task DeactivateDeviceAsync(int id)
    {
        var item=await FindDeviceAsync(id);
        if(await db.TrayDevices.AnyAsync(x=>x.DeviceId==id&&x.IsActive))throw new AppException(409,"Unassign active tray device before deactivating the device.");
        item.Status=DeviceStatuses.Inactive;await db.SaveChangesAsync();
    }

    public async Task<List<TrayDeviceResponse>> TrayDevicesAsync(int? soilTrayId,bool? active)
    {
        var query=db.TrayDevices.AsNoTracking().Include(x=>x.SoilTray).Include(x=>x.Device)
            .Where(x=>(!soilTrayId.HasValue||x.SoilTrayId==soilTrayId)&&(!active.HasValue||x.IsActive==active));
        return (await query.OrderByDescending(x=>x.AssignedAt).ToListAsync()).Select(ToDto).ToList();
    }
    public async Task<TrayDeviceResponse> AssignAsync(AssignTrayDeviceRequest request)
    {
        var tray=await db.SoilTrays.FindAsync(request.SoilTrayId)??throw new AppException(404,"Soil tray not found.");
        var device=await FindDeviceAsync(request.DeviceId);if(device.Status==DeviceStatuses.Inactive)throw new AppException(409,"Inactive device cannot be assigned.");
        var component=NormalizeComponent(request.ComponentType);
        var existing=await db.TrayDevices.Include(x=>x.SoilTray).Include(x=>x.Device).FirstOrDefaultAsync(x=>x.SoilTrayId==request.SoilTrayId&&x.DeviceId==request.DeviceId&&x.ComponentType==component);
        if(existing is not null){existing.PinNumber=request.PinNumber?.Trim();existing.IsActive=true;existing.AssignedAt=DateTime.UtcNow;await db.SaveChangesAsync();return ToDto(existing);}
        if(await db.TrayDevices.AnyAsync(x=>x.DeviceId==request.DeviceId&&x.IsActive))throw new AppException(409,"Device is already assigned to another tray component.");
        var item=new TrayDevice{SoilTrayId=tray.SoilTrayId,SoilTray=tray,DeviceId=device.DeviceId,Device=device,PinNumber=request.PinNumber?.Trim(),ComponentType=component};
        db.Add(item);await db.SaveChangesAsync();return ToDto(item);
    }
    public async Task<TrayDeviceResponse> DeactivateAssignmentAsync(int id)
    {
        var item=await db.TrayDevices.Include(x=>x.SoilTray).Include(x=>x.Device).FirstOrDefaultAsync(x=>x.TrayDeviceId==id)??throw new AppException(404,"Tray device assignment not found.");
        item.IsActive=false;await db.SaveChangesAsync();return ToDto(item);
    }

    public async Task<CameraSnapshotResponse> AddSnapshotAsync(CameraSnapshotRequest request)
    {
        await FindDeviceAsync(request.DeviceId);var rental=await db.TrayRentals.FindAsync(request.RentalId)??throw new AppException(404,"Growing cycle not found.");
        if(!await db.TrayDevices.AnyAsync(x=>x.DeviceId==request.DeviceId&&x.SoilTrayId==rental.SoilTrayId&&x.IsActive))throw new AppException(409,"Device is not assigned to the rental tray.");
        var item=new CameraSnapshot{DeviceId=request.DeviceId,RentalId=request.RentalId,ImageUrl=request.ImageUrl.Trim(),TakenAt=request.TakenAt?.ToUniversalTime()??DateTime.UtcNow};
        db.Add(item);await db.SaveChangesAsync();return ToDto(item);
    }

    /// <summary>
    /// Lưu ảnh từ ESP32-CAM: ghi mảng byte ra ổ đĩa rồi tạo bản ghi CameraSnapshot với ImageUrl công khai.
    /// API layer chịu trách nhiệm đọc file multipart và cung cấp thư mục gốc + base URL (ranh giới tầng:
    /// Services không phụ thuộc IWebHostEnvironment). Validate device + rental y hệt AddSnapshotAsync.
    /// </summary>
    public async Task<CameraSnapshotResponse> AddSnapshotFromUploadAsync(
        int deviceId,int rentalId,DateTime? takenAt,
        byte[] imageBytes,string fileExtension,string physicalDir,string publicBaseUrl)
    {
        var device = await FindDeviceAsync(deviceId);
        device.LastSeen = DateTime.UtcNow;
        device.Status = DeviceStatuses.Online;
        var rental=await db.TrayRentals.FindAsync(rentalId)??throw new AppException(404,"Growing cycle not found.");
        if(!await db.TrayDevices.AnyAsync(x=>x.DeviceId==deviceId&&x.SoilTrayId==rental.SoilTrayId&&x.IsActive))
            throw new AppException(409,"Device is not assigned to the rental tray.");
        if(imageBytes.Length==0)throw new AppException(400,"Empty image file.");

        var ext=fileExtension.StartsWith('.')?fileExtension.ToLowerInvariant():"."+fileExtension.ToLowerInvariant();
        var fileName=$"snap_{deviceId}_{rentalId}_{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{ext}";
        Directory.CreateDirectory(physicalDir);
        await File.WriteAllBytesAsync(Path.Combine(physicalDir,fileName),imageBytes);

        var imageUrl=$"{publicBaseUrl.TrimEnd('/')}/uploads/snapshots/{fileName}";

        if (r2Options is { Enabled: true } &&
            !string.IsNullOrWhiteSpace(r2Options.AccountId) &&
            !string.IsNullOrWhiteSpace(r2Options.ApiToken) &&
            !string.IsNullOrWhiteSpace(r2Options.BucketName))
        {
            var r2Url = await UploadToR2Async(fileName, imageBytes, ext);
            if (!string.IsNullOrWhiteSpace(r2Url))
            {
                imageUrl = r2Url;
            }
        }

        var item=new CameraSnapshot{DeviceId=deviceId,RentalId=rentalId,ImageUrl=imageUrl,TakenAt=takenAt?.ToUniversalTime()??DateTime.UtcNow};
        db.Add(item);await db.SaveChangesAsync();return ToDto(item);
    }

    private async Task<string?> UploadToR2Async(string fileName, byte[] imageBytes, string ext)
    {
        try
        {
            var client = httpClient ?? FallbackHttpClient;
            var url = $"https://api.cloudflare.com/client/v4/accounts/{r2Options!.AccountId}/r2/buckets/{r2Options.BucketName}/objects/{fileName}";
            using var req = new HttpRequestMessage(HttpMethod.Put, url);
            req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", r2Options.ApiToken);
            var mime = ext switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => "image/jpeg"
            };
            req.Content = new ByteArrayContent(imageBytes);
            req.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mime);

            using var res = await client.SendAsync(req);
            if (res.IsSuccessStatusCode)
            {
                var domain = string.IsNullOrWhiteSpace(r2Options.PublicDomain)
                    ? "https://pub-7dfeb459c49842f69ca547ad3bb40357.r2.dev"
                    : r2Options.PublicDomain.TrimEnd('/');
                return $"{domain}/{fileName}";
            }
        }
        catch
        {
            // Fallback sang local nếu Cloudflare R2 tạm thời không khả dụng
        }
        return null;
    }
    public async Task<PagedResponse<object>> SnapshotsAsync(QueryRequest request,int? rentalId,int? deviceId)
    {
        var query=db.CameraSnapshots.AsNoTracking().Where(x=>(!rentalId.HasValue||x.RentalId==rentalId)&&(!deviceId.HasValue||x.DeviceId==deviceId));
        var (page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();var rows=await query.OrderByDescending(x=>x.TakenAt).Skip((page-1)*size).Take(size).ToListAsync();
        return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }

    // ---- Customer xem ảnh khay của CHÍNH MÌNH (theo rental sở hữu) ----

    // Xác nhận rental thuộc về customer đang đăng nhập; nếu không phải chủ trả 404 (không lộ tồn tại).
    private async Task EnsureRentalOwnedAsync(int rentalId,int customerId)
    {
        if(!await db.TrayRentals.AsNoTracking().AnyAsync(x=>x.RentalId==rentalId&&x.CustomerId==customerId))
            throw new AppException(404,"Rental not found.");
    }

    /// <summary>Customer lấy ảnh mới nhất của khay mình thuê. Chưa có ảnh -> 404.</summary>
    public async Task<CameraSnapshotResponse> LatestSnapshotForCustomerAsync(int customerId,int rentalId)
    {
        await EnsureRentalOwnedAsync(rentalId,customerId);
        var latest=await db.CameraSnapshots.AsNoTracking().Where(x=>x.RentalId==rentalId)
            .OrderByDescending(x=>x.TakenAt).FirstOrDefaultAsync()
            ??throw new AppException(404,"No camera image available for this rental yet.");
        return ToDto(latest);
    }

    /// <summary>Customer xem lịch sử ảnh của khay mình thuê (mới nhất trước).</summary>
    public async Task<PagedResponse<object>> SnapshotsForCustomerAsync(int customerId,int rentalId,QueryRequest request)
    {
        await EnsureRentalOwnedAsync(rentalId,customerId);
        var query=db.CameraSnapshots.AsNoTracking().Where(x=>x.RentalId==rentalId);
        var (page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();
        var rows=await query.OrderByDescending(x=>x.TakenAt).Skip((page-1)*size).Take(size).ToListAsync();
        return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }
    public async Task<PagedResponse<object>> ActuatorLogsAsync(QueryRequest request,int? deviceId,string? result,DateTime? from,DateTime? to)
    {
        if(from.HasValue&&to.HasValue&&from>to)throw new AppException(400,"From must be earlier than or equal to To.");
        var query=db.ActuatorLogs.AsNoTracking().Where(x=>(!deviceId.HasValue||x.DeviceId==deviceId)&&(string.IsNullOrWhiteSpace(result)||x.Result==result.ToUpper())&&(!from.HasValue||x.RequestedAt>=from)&&(!to.HasValue||x.RequestedAt<=to));
        var (page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();var rows=await query.OrderByDescending(x=>x.RequestedAt).Skip((page-1)*size).Take(size).ToListAsync();
        return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }
    public async Task<ActuatorLogResponse> ActuatorCommandAsync(int deviceId,int requestedByUserId,ActuatorCommandRequest request,CancellationToken cancellationToken=default)
    {
        var device=await FindDeviceAsync(deviceId);
        if(device.Status==DeviceStatuses.Inactive)throw new AppException(409,"Inactive device cannot receive commands.");
        var actuator=NormalizeActuator(request.ActuatorType);var action=NormalizeAction(request.Action);
        if(commandPublisher is null)throw new AppException(503,"MQTT command publisher is unavailable.");
        var requestedAt=DateTime.UtcNow;var commandId=Guid.NewGuid().ToString("N");
        var assignment=await db.TrayDevices.AsNoTracking().FirstOrDefaultAsync(x=>x.DeviceId==deviceId&&x.IsActive&&x.ComponentType==actuator);
        var log=new ActuatorLog{DeviceId=deviceId,PinNumber=assignment?.PinNumber,ActuatorType=actuator,Action=action,TriggeredBy="MANUAL",CommandId=commandId,RequestedByUserId=requestedByUserId,RequestedAt=requestedAt,Result="PENDING"};
        db.ActuatorLogs.Add(log);await db.SaveChangesAsync(cancellationToken);
        try{await commandPublisher.PublishAsync(new(commandId,device.DeviceCode,actuator,action,requestedAt),cancellationToken);}
        catch(Exception ex){log.Result="FAILED";log.AcknowledgedAt=DateTime.UtcNow;log.FailureReason=$"MQTT publish failed: {ex.Message}";await db.SaveChangesAsync(cancellationToken);throw new AppException(503,"Unable to publish actuator command.");}
        return ToDto(log);
    }
    public async Task<ActuatorLogResponse> ActuatorCommandAsync(string commandId)
        =>ToDto(await db.ActuatorLogs.AsNoTracking().FirstOrDefaultAsync(x=>x.CommandId==commandId)??throw new AppException(404,"Actuator command not found."));
    public async Task ProcessActuatorAckAsync(ActuatorCommandAckRequest request)
    {
        var commandId=request.CommandId.Trim();var item=await db.ActuatorLogs.Include(x=>x.Device).FirstOrDefaultAsync(x=>x.CommandId==commandId)??throw new AppException(404,"Actuator command not found.");
        if(!string.Equals(item.Device?.DeviceCode,request.DeviceCode.Trim(),StringComparison.Ordinal))throw new AppException(409,"Acknowledgement device does not match command device.");
        var result=request.Result.Trim().ToUpperInvariant();if(result is not ("SUCCESS" or "FAILED"))throw new AppException(400,"Acknowledgement result must be SUCCESS or FAILED.");
        if(item.Result is "SUCCESS" or "FAILED")return;
        item.Result=result;item.FailureReason=result=="FAILED"?request.FailureReason?.Trim():null;item.AcknowledgedAt=request.AcknowledgedAt?.ToUniversalTime()??DateTime.UtcNow;await db.SaveChangesAsync();
    }
    public async Task<PagedResponse<object>> AlertsAsync(QueryRequest request,bool? resolved,string? severity,int? deviceId)
    {
        var query=db.SystemAlerts.AsNoTracking().Where(x=>(!resolved.HasValue||x.IsResolved==resolved)&&(!deviceId.HasValue||x.DeviceId==deviceId)&&(string.IsNullOrWhiteSpace(severity)||x.Severity==severity.ToUpper()));
        var (page,size)=QueryHelper.Paging(request);var total=await query.CountAsync();var rows=await query.OrderByDescending(x=>x.CreatedAt).Skip((page-1)*size).Take(size).ToListAsync();
        return new(rows.Select(x=>(object)ToDto(x)).ToList(),page,size,total);
    }
    public async Task<SystemAlertResponse> ResolveAlertAsync(int id,bool resolved)
    {
        var item=await db.SystemAlerts.FindAsync(id)??throw new AppException(404,"System alert not found.");item.IsResolved=resolved;await db.SaveChangesAsync();return ToDto(item);
    }

    private async Task<IoTDevice> FindDeviceAsync(int id)=>await db.IoTDevices.FindAsync(id)??throw new AppException(404,"IoT device not found.");
    private async Task EnsureDeviceUniqueAsync(string code,string? mac,int? id)
    {
        var normalizedCode=code.Trim();var normalizedMac=string.IsNullOrWhiteSpace(mac)?null:mac.Trim().ToUpperInvariant();
        if(await db.IoTDevices.AnyAsync(x=>x.DeviceId!=id&&(x.DeviceCode==normalizedCode||(normalizedMac!=null&&x.MacAddress==normalizedMac))))throw new AppException(409,"Device code or MAC address already exists.");
    }
    private static void Apply(IoTDevice item,IoTDeviceRequest request){item.DeviceCode=request.DeviceCode.Trim();item.MacAddress=string.IsNullOrWhiteSpace(request.MacAddress)?null:request.MacAddress.Trim().ToUpperInvariant();item.DeviceType=request.DeviceType.Trim().ToUpperInvariant();item.FirmwareVersion=request.FirmwareVersion?.Trim();item.Status=NormalizeDeviceStatus(request.Status);}
    private static string NormalizeDeviceStatus(string value){var result=value.Trim().ToUpperInvariant();if(!DeviceStatuses.All.Contains(result))throw new AppException(400,"Invalid device status.");return result;}
    private static string NormalizeComponent(string value){var result=value.Trim().TrimEnd('.').ToUpperInvariant();if(!ComponentTypes.All.Contains(result))throw new AppException(400,"Invalid component type.");return result;}
    private static string NormalizeActuator(string value){var result=value.Trim().ToUpperInvariant();if(result=="FAN")result=ComponentTypes.VentilationFan;if(result=="LED")result=ComponentTypes.LedLight;if(result=="PUMP")result=ComponentTypes.WaterPump;if(result is not (ComponentTypes.VentilationFan or ComponentTypes.LedLight or ComponentTypes.WaterPump))throw new AppException(400,"Actuator type must be FAN, LED, or PUMP.");return result;}
    private static string NormalizeAction(string value){var result=value.Trim().ToUpperInvariant();if(result is not ("ON" or "OFF"))throw new AppException(400,"Action must be ON or OFF.");return result;}
    private static IoTDeviceResponse ToDto(IoTDevice x)=>new(x.DeviceId,x.DeviceCode,x.MacAddress,x.DeviceType,x.FirmwareVersion,x.Status,x.LastSeen);
    private static TrayDeviceResponse ToDto(TrayDevice x)=>new(x.TrayDeviceId,x.SoilTrayId,x.SoilTray?.TrayCode??"",x.DeviceId,x.Device?.DeviceCode??"",x.PinNumber,x.ComponentType,x.AssignedAt,x.IsActive);
    private static CameraSnapshotResponse ToDto(CameraSnapshot x)=>new(x.SnapshotId,x.DeviceId,x.RentalId,x.ImageUrl,x.TakenAt);
    private static ActuatorLogResponse ToDto(ActuatorLog x)=>new(x.LogId,x.DeviceId,x.PinNumber,x.ActuatorType,x.Action,x.TriggeredBy,x.CommandId,x.RequestedByUserId,x.RequestedAt,x.AcknowledgedAt,x.Result,x.FailureReason);
    private static SystemAlertResponse ToDto(SystemAlert x)=>new(x.AlertId,x.DeviceId,x.SupplyId,x.RentalId,x.AlertType,x.Severity,x.Message,x.IsResolved,x.CreatedAt);
}
