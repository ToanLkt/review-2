namespace SmartFarm.Services.Models;

public class ApiResponse<T>
{
    public ApiResponse() { }
    public ApiResponse(bool success, string message, T? data, object? errors = null)
    { Success = success; Message = message; Data = data; Errors = errors; }
    public bool Success { get; set; }
    public string Message { get; set; } = "";
    public T? Data { get; set; }
    public object? Errors { get; set; }
    public static ApiResponse<T> Ok(T data, string message = "Request processed successfully") => new(true, message, data);
}

public record QueryRequest(string? Search = null, string? Sort = null, int Page = 1,
    int PageSize = 20, string? Fields = null, string? Expand = null);

public class PagedResponse<T>
{
    public PagedResponse() { }
    public PagedResponse(IReadOnlyList<T> items, int page, int pageSize, int totalItems)
    { Items = items; Page = page; PageSize = pageSize; TotalItems = totalItems; }
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalItems / (double)PageSize);
}

public class AuthTokensResponse
{
    public AuthTokensResponse() { }
    public AuthTokensResponse(string accessToken, string refreshToken, DateTime expiresAt)
    { AccessToken = accessToken; RefreshToken = refreshToken; ExpiresAt = expiresAt; }
    public string AccessToken { get; set; } = "";
    public string RefreshToken { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
}

public class LoginResponse
{
    public LoginResponse() { }
    public LoginResponse(AuthTokensResponse tokens, UserResponse user) { Tokens = tokens; User = user; }
    public AuthTokensResponse Tokens { get; set; } = new();
    public UserResponse User { get; set; } = new();
}

public record RefreshTokenRequest(string RefreshToken);
