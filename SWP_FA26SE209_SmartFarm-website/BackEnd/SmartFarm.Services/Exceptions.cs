namespace SmartFarm.Services;

public class AppException(int statusCode, string message, object? errors = null) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public object? Errors { get; } = errors;
}
