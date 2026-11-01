using System.Net.Mime;
using SmartFarm.Services;
using SmartFarm.Services.Models;

namespace SmartFarm.Api.Middleware;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception exception)
        {
            var status = exception is AppException app ? app.StatusCode : 500;
            var message = exception is AppException ? exception.Message : "Internal server error";
            var errors = exception is AppException known ? known.Errors : null;
            if (status == 500) logger.LogError(exception, "Unhandled request exception");
            context.Response.StatusCode = status;
            context.Response.ContentType = MediaTypeNames.Application.Json;
            await context.Response.WriteAsJsonAsync(new ApiResponse<object>(false, message, null, errors));
        }
    }
}
