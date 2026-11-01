using System.ComponentModel.DataAnnotations;

namespace SmartFarm.Services.Models;

public record IoTDeviceRequest([Required,MaxLength(100)]string DeviceCode,[MaxLength(50)]string? MacAddress,
    [Required,MaxLength(50)]string DeviceType,[MaxLength(50)]string? FirmwareVersion,[Required,MaxLength(30)]string Status);
public record DeviceStatusRequest([Required,MaxLength(30)]string Status,DateTime? LastSeen);
public record AssignTrayDeviceRequest([Range(1,int.MaxValue)]int SoilTrayId,[Range(1,int.MaxValue)]int DeviceId,
    [MaxLength(30)]string? PinNumber,[Required,MaxLength(40)]string ComponentType);
public record CameraSnapshotRequest([Range(1,int.MaxValue)]int DeviceId,[Range(1,int.MaxValue)]int RentalId,
    [Required,MaxLength(1000)]string ImageUrl,DateTime? TakenAt);
// Lưu ảnh từ ESP32-CAM: nhận file multipart, backend tự lưu file + sinh ImageUrl công khai.
// Khác CameraSnapshotRequest (chỉ nhận URL có sẵn) — đây là luồng upload file thật.
public record CameraSnapshotUploadForm([Range(1,int.MaxValue)]int DeviceId,[Range(1,int.MaxValue)]int RentalId,DateTime? TakenAt);
public record ResolveAlertRequest(bool IsResolved=true);
public record ActuatorCommandRequest([Required,MaxLength(30)]string ActuatorType,[Required,MaxLength(10)]string Action);
public record ActuatorCommandMessage(string CommandId,string DeviceCode,string ActuatorType,string Action,DateTime RequestedAt);
public record ActuatorCommandAckRequest([Required,MaxLength(100)]string CommandId,[Required,MaxLength(100)]string DeviceCode,
    [Required,MaxLength(20)]string Result,[MaxLength(500)]string? FailureReason,DateTime? AcknowledgedAt);

public record DeviceThresholdMessage(
    string DeviceCode,
    int SupplyId,
    string Stage,
    float? MinSoilMoisture,
    float? MaxSoilMoisture,
    float MinAirHumidity,
    float MaxAirHumidity,
    float MinTemperature,
    float MaxTemperature,
    float MinLightIntensity,
    float MaxLightIntensity,
    int LightHoursPerDay);

public interface IActuatorCommandPublisher
{
    Task PublishAsync(ActuatorCommandMessage command,CancellationToken cancellationToken=default);
    Task PublishThresholdAsync(DeviceThresholdMessage threshold,CancellationToken cancellationToken=default);
}

public record IoTDeviceResponse(int DeviceId,string DeviceCode,string? MacAddress,string DeviceType,string? FirmwareVersion,string Status,DateTime? LastSeen);
public record TrayDeviceResponse(int TrayDeviceId,int SoilTrayId,string TrayCode,int DeviceId,string DeviceCode,string? PinNumber,string ComponentType,DateTime AssignedAt,bool IsActive);
public record CameraSnapshotResponse(long SnapshotId,int DeviceId,int RentalId,string ImageUrl,DateTime TakenAt);
public record ActuatorLogResponse(long LogId,int DeviceId,string? PinNumber,string ActuatorType,string Action,string TriggeredBy,string? CommandId,int? RequestedByUserId,DateTime RequestedAt,DateTime? AcknowledgedAt,string Result,string? FailureReason);
public record SystemAlertResponse(int AlertId,int? DeviceId,int? SupplyId,int? RentalId,string AlertType,string Severity,string Message,bool IsResolved,DateTime CreatedAt);

public class CloudflareR2Options
{
    public bool Enabled { get; set; }
    public string AccountId { get; set; } = "";
    public string BucketName { get; set; } = "smartfarm-camera";
    public string ApiToken { get; set; } = "";
    public string PublicDomain { get; set; } = "";
}
