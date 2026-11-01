using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartFarm.Services.Services;
using SmartFarm.Services.Validation;
using SmartFarm.Services.Models;

namespace SmartFarm.Services;

public static class DependencyInjection
{
    public static IServiceCollection AddBusinessServices(this IServiceCollection services, IConfiguration config)
    {
        var jwt = config.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
        if (jwt.Key.Length < 32) throw new InvalidOperationException("Jwt:Key must be at least 32 characters.");
        services.AddSingleton(jwt);
        services.AddSingleton<JwtService>();

        var smtp = config.GetSection("Smtp").Get<SmtpOptions>() ?? new SmtpOptions();
        services.AddSingleton(smtp);
        services.AddSingleton<IEmailService, EmailService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IRentalService, RentalService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<PaymentService>();
        services.AddScoped<DeliveryService>();
        services.AddScoped<DeliveryPricingService>();
        services.AddScoped<NotificationService>();

        var r2 = config.GetSection("CloudflareR2").Get<CloudflareR2Options>() ?? new CloudflareR2Options();
        services.AddSingleton(r2);
        services.AddHttpClient("CloudflareR2", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddScoped<IoTManagementService>(sp =>
        {
            var db = sp.GetRequiredService<SmartFarm.Repositories.Data.AppDbContext>();
            var publisher = sp.GetService<IActuatorCommandPublisher>();
            var r2Options = sp.GetRequiredService<CloudflareR2Options>();
            var httpFactory = sp.GetRequiredService<System.Net.Http.IHttpClientFactory>();
            return new IoTManagementService(db, publisher, r2Options, httpFactory.CreateClient("CloudflareR2"));
        });

        services.AddScoped<InventoryService>();
        services.AddScoped<ReportingService>();
        services.AddScoped<TelemetryService>();
        services.AddSingleton(config.GetSection("Mqtt").Get<MqttOptions>() ?? new MqttOptions());
        services.AddSingleton(config.GetSection("SePay").Get<SePayOptions>() ?? new SePayOptions());

        // OSRM routing: dùng typed HttpClient để tính khoảng cách giao hàng (Project-OSRM/osrm-backend).
        var osrm = config.GetSection("Osrm").Get<OsrmOptions>() ?? new OsrmOptions();
        services.AddSingleton(osrm);
        services.AddHttpClient<IRoutingService, OsrmRoutingService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(osrm.TimeoutSeconds <= 0 ? 10 : osrm.TimeoutSeconds);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("SmartFarm-Backend/1.0");
        });
        services.AddScoped<FarmInfrastructureService>();
        services.AddScoped<CultivationService>();
        services.AddScoped<ReviewService>();
        services.AddScoped<FarmConfigService>();
        services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();
        return services;
    }
}
