using System.Text.Json;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;
using SmartFarm.Services.Models;

namespace SmartFarm.Api.Infrastructure;

public sealed class MqttActuatorCommandPublisher(MqttOptions options) : IActuatorCommandPublisher
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task PublishAsync(ActuatorCommandMessage command,CancellationToken cancellationToken=default)
    {
        if(!options.Enabled)throw new InvalidOperationException("MQTT is disabled.");
        var factory=new MqttFactory();using var client=factory.CreateMqttClient();
        var clientOptions=new MqttClientOptionsBuilder()
            .WithClientId($"{options.ClientId}-commands-{Guid.NewGuid():N}")
            .WithTcpServer(options.Host,options.Port).WithCredentials(options.Username,options.Password).WithCleanSession().Build();
        await client.ConnectAsync(clientOptions,cancellationToken);
        var message=new MqttApplicationMessageBuilder()
            .WithTopic($"smartfarm/devices/{command.DeviceCode}/commands")
            .WithPayload(JsonSerializer.Serialize(command,JsonOptions))
            .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce).WithRetainFlag(false).Build();
        await client.PublishAsync(message,cancellationToken);
        await client.DisconnectAsync();
    }
}
