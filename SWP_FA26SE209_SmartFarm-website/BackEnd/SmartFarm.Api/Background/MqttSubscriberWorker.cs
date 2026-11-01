using System.Text.Json;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Background;

public sealed class MqttSubscriberWorker(IServiceScopeFactory scopes,MqttOptions options,ILogger<MqttSubscriberWorker> logger):BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions=new(JsonSerializerDefaults.Web){PropertyNameCaseInsensitive=true};

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if(!options.Enabled){logger.LogInformation("MQTT subscriber disabled");return;}
        var factory=new MqttFactory();using var client=factory.CreateMqttClient();
        client.ApplicationMessageReceivedAsync+=async e=>await ProcessAsync(e.ApplicationMessage.Topic,e.ApplicationMessage.ConvertPayloadToString());
        var config=new MqttClientOptionsBuilder().WithClientId(options.ClientId).WithTcpServer(options.Host,options.Port)
            .WithCredentials(options.Username,options.Password).WithCleanSession().Build();
        while(!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if(!client.IsConnected)
                {
                    await client.ConnectAsync(config,stoppingToken);
                    await client.SubscribeAsync(new MqttClientSubscribeOptionsBuilder()
                        .WithTopicFilter(f=>f.WithTopic("smartfarm/devices/+/telemetry").WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce))
                        .WithTopicFilter(f=>f.WithTopic("smartfarm/devices/+/heartbeat").WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce))
                        .WithTopicFilter(f=>f.WithTopic("smartfarm/devices/+/command-acks").WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce))
                        .Build(),stoppingToken);
                    logger.LogInformation("MQTT connected to {Host}:{Port}",options.Host,options.Port);
                }
                await Task.Delay(TimeSpan.FromSeconds(5),stoppingToken);
            }
            catch(OperationCanceledException)when(stoppingToken.IsCancellationRequested){break;}
            catch(Exception ex){logger.LogError(ex,"MQTT connection failed; retrying");await Task.Delay(TimeSpan.FromSeconds(5),stoppingToken);}
        }
        if(client.IsConnected)await client.DisconnectAsync();
    }

    private async Task ProcessAsync(string topic,string payload)
    {
        try
        {
            using var scope=scopes.CreateScope();var parts=topic.Split('/');if(parts.Length<4)return;var code=parts[2];
            if(topic.EndsWith("/telemetry"))
            {
                var request=JsonSerializer.Deserialize<TelemetryIngestRequest>(payload,JsonOptions)??throw new InvalidOperationException("Empty telemetry payload");
                EnsureDeviceMatches(code,request.DeviceCode);await scope.ServiceProvider.GetRequiredService<TelemetryService>().IngestAsync(request);
            }
            else if(topic.EndsWith("/heartbeat"))
            {
                var request=JsonSerializer.Deserialize<HeartbeatRequest>(payload,JsonOptions)??new HeartbeatRequest(code,null);
                EnsureDeviceMatches(code,request.DeviceCode);await scope.ServiceProvider.GetRequiredService<TelemetryService>().HeartbeatAsync(code,request.RecordedAt);
            }
            else if(topic.EndsWith("/command-acks"))
            {
                var request=JsonSerializer.Deserialize<ActuatorCommandAckRequest>(payload,JsonOptions)??throw new InvalidOperationException("Empty actuator acknowledgement payload");
                EnsureDeviceMatches(code,request.DeviceCode);await scope.ServiceProvider.GetRequiredService<IoTManagementService>().ProcessActuatorAckAsync(request);
            }
        }
        catch(Exception ex){logger.LogWarning(ex,"Rejected MQTT message on {Topic}",topic);}
    }

    private static void EnsureDeviceMatches(string topicDeviceCode,string payloadDeviceCode)
    {
        if(!string.Equals(topicDeviceCode,payloadDeviceCode,StringComparison.Ordinal))throw new InvalidOperationException("Topic deviceCode does not match payload");
    }
}
