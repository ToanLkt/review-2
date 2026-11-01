using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartFarm.Repositories.Data;

namespace SmartFarm.Repositories;

public static class DependencyInjection
{
    public static IServiceCollection AddRepositories(this IServiceCollection services, IConfiguration config)
    {
        var connection = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");
        services.AddDbContext<AppDbContext>(o =>
            o.UseMySql(connection, new MySqlServerVersion(new Version(8, 0, 36))));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        return services;
    }
}
