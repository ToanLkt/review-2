using System.ComponentModel.DataAnnotations;
namespace SmartFarm.Services.Models;
public sealed class MqttOptions { public bool Enabled{get;set;}=true; public string Host{get;set;}="mqtt"; public int Port{get;set;}=1883; public string Username{get;set;}=""; public string Password{get;set;}=""; public string ClientId{get;set;}="smartfarm-backend"; public string IngestApiKey{get;set;}=""; }
public record TelemetryIngestRequest([Required,MaxLength(120)]string MessageId,[Required,MaxLength(100)]string DeviceCode,DateTime RecordedAt,float? Temperature,float? AirHumidity,float? SoilHumidity,float? LightIntensity,bool? FanState=null,bool? LedState=null,bool? PumpState=null);
public record TelemetryResponse(long TelemetryId,string MessageId,int DeviceId,string DeviceCode,int SoilTrayId,float? Temperature,float? AirHumidity,float? SoilHumidity,float? LightIntensity,bool? FanState,bool? LedState,bool? PumpState,DateTime RecordedAt,bool IsStale);
public record HeartbeatRequest([Required,MaxLength(100)]string DeviceCode,DateTime? RecordedAt);
