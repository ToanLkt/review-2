using System.Security.Claims;
using System.Text;
using Asp.Versioning;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SmartFarm.Api.Data;
using SmartFarm.Api.Background;
using SmartFarm.Api.Middleware;
using SmartFarm.Api.Infrastructure;
using SmartFarm.Repositories;
using SmartFarm.Repositories.Data;
using SmartFarm.Services;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRepositories(builder.Configuration);
builder.Services.AddBusinessServices(builder.Configuration);
builder.Services.AddHostedService<OrderExpirationWorker>();
builder.Services.AddHostedService<NotificationDispatchWorker>();
builder.Services.AddHostedService<MqttSubscriberWorker>();
builder.Services.AddHostedService<PlantingActivationWorker>();
builder.Services.AddSingleton<IActuatorCommandPublisher,MqttActuatorCommandPublisher>();
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        ValidIssuer = jwt.Issuer, ValidAudience = jwt.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
        ClockSkew = TimeSpan.FromSeconds(30)
    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var id = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            var version = context.Principal?.FindFirstValue("token_version");
            if (!int.TryParse(id, out var userId) || !int.TryParse(version, out var tokenVersion))
            { context.Fail("Invalid token claims."); return; }
            var user = await db.Users.AsNoTracking().Where(u => u.UserId == userId)
                .Select(u => new { u.IsActive, u.TokenVersion }).FirstOrDefaultAsync();
            if (user is null || !user.IsActive || user.TokenVersion != tokenVersion)
                context.Fail("Token has been revoked.");
        },
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(
                new ApiResponse<object>(false, "Authentication is required.", null));
        },
        OnForbidden = async context =>
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(
                new ApiResponse<object>(false, "You do not have permission to access this resource.", null));
        }
    };
});
builder.Services.AddAuthorization();

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = false;
    options.ReportApiVersions = true;
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddControllers(options =>
{
    options.ReturnHttpNotAcceptable = true;
    options.RespectBrowserAcceptHeader = true;
}).AddJsonOptions(options =>
{
    // Entity EF có navigation hai chiều (SoilTray <-> Rack <-> Zone...). Khi trả entity thô,
    // System.Text.Json gặp vòng lặp tham chiếu và ném lỗi -> 500 lúc serialize dù dữ liệu đã lưu.
    // Bỏ qua chu trình để serialize an toàn thay vì vỡ.
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
}).AddXmlDataContractSerializerFormatters();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context => new BadRequestObjectResult(
        new ApiResponse<object>(false, "Validation failed", null,
            context.ModelState.Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(x => x.Key, x => x.Value!.Errors.Select(e => e.ErrorMessage).ToArray())));
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "SmartFarm API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = Array.Empty<string>()
    });
});
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:3000"])
    .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionMiddleware>();

// Swagger: bật ở Development, và ở mọi môi trường khi cấu hình "Swagger:Enabled"=true
// (đồ án cần demo Swagger trên production nên không khoá cứng theo IsDevelopment()).
if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Seed dữ liệu: chạy khi đang Development, hoặc khi bật rõ "Seed:Enabled"=true trên production.
// DbSeeder phải tự idempotent (chỉ thêm khi chưa có) để chạy lại mỗi lần boot không nhân đôi.
if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Seed:Enabled"))
{
    using var scope = app.Services.CreateScope();
    await DbSeeder.SeedAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>(), app.Configuration);
}

// Phục vụ file tĩnh (ảnh camera đã upload) từ wwwroot -> /uploads/snapshots/<file>.
app.UseStaticFiles();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
