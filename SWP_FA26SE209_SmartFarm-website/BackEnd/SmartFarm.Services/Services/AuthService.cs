using System.Security.Cryptography;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public interface IAuthService
{
    Task<UserResponse> RegisterAsync(RegisterRequest request);
    Task ConfirmEmailAsync(ConfirmEmailRequest request);
    Task ResendConfirmEmailAsync(ResendConfirmEmailRequest request);
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RefreshAsync(RefreshTokenRequest request);
    Task LogoutAsync(int userId, string? refreshToken);
    Task ForgotPasswordAsync(ForgotPasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);
    Task<LoginResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<UserResponse> GetProfileAsync(int userId);
    Task<UserResponse> UpdateProfileAsync(int userId, UpdateProfileRequest request);
}

public sealed class AuthService(
    IUnitOfWork unit,
    JwtService jwt,
    IEmailService emailService,
    IValidator<RegisterRequest> registerValidator) : IAuthService
{
    private static UserResponse ToDto(User user) => new(user.UserId, user.Email, user.FullName,
        user.PhoneNumber, user.Address, user.Role, user.IsActive, user.EmailConfirmed, user.CreatedAt, user.AvatarUrl, user.UpdatedAt);

    public async Task<UserResponse> RegisterAsync(RegisterRequest request)
    {
        var validation = await registerValidator.ValidateAsync(request);
        if (!validation.IsValid)
            throw new AppException(400, "Validation failed", validation.Errors.Select(e => e.ErrorMessage));

        var email = request.Email.Trim().ToLowerInvariant();
        var existing = await unit.Users.Query(false).FirstOrDefaultAsync(u => u.Email == email);
        if (existing is not null)
        {
            if (existing.EmailConfirmed)
                throw new AppException(409, "Email already registered.");
            throw new AppException(409, "Email already registered but not confirmed. Please check your inbox or resend the confirmation email.");
        }

        var user = new User
        {
            Email = email, PasswordHash = PasswordHasher.Hash(request.Password),
            FullName = request.FullName.Trim(), PhoneNumber = request.Phone, Address = request.Address,
            Role = RoleNames.Customer
        };
        user.EmailConfirmToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.EmailConfirmTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
        user.LastEmailSentAt = DateTime.UtcNow;
        unit.Users.Add(user);
        await unit.SaveChangesAsync();
        await emailService.SendEmailConfirmationAsync(user.Email, user.FullName, user.UserId, user.EmailConfirmToken);
        return ToDto(user);
    }

    public async Task ConfirmEmailAsync(ConfirmEmailRequest request)
    {
        var emailStr = request.Email.Trim().ToLowerInvariant();
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.Email == emailStr);
        if (user is null) throw new AppException(400, "Invalid email or token.");
        if (user.EmailConfirmed) return; // already confirmed, idempotent

        if (user.EmailConfirmToken is null || user.EmailConfirmTokenExpiresAt <= DateTime.UtcNow ||
            !FixedEquals(user.EmailConfirmToken, request.Token))
            throw new AppException(400, "Invalid or expired confirmation token.");

        user.EmailConfirmed = true;
        user.EmailConfirmToken = null;
        user.EmailConfirmTokenExpiresAt = null;
        await unit.SaveChangesAsync();
    }

    public async Task ResendConfirmEmailAsync(ResendConfirmEmailRequest request)
    {
        var emailStr = request.Email.Trim().ToLowerInvariant();
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.Email == emailStr);
        if (user is null || user.EmailConfirmed) return; // silent return if not found or already confirmed

        if (user.LastEmailSentAt.HasValue && (DateTime.UtcNow - user.LastEmailSentAt.Value).TotalSeconds < 60)
            throw new AppException(429, "Please wait 60 seconds before requesting another email.");

        user.EmailConfirmToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.EmailConfirmTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
        user.LastEmailSentAt = DateTime.UtcNow;
        await unit.SaveChangesAsync();
        await emailService.SendEmailConfirmationAsync(user.Email, user.FullName, user.UserId, user.EmailConfirmToken);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            throw new AppException(401, "Invalid email or password.");
        if (!user.EmailConfirmed) throw new AppException(403, "Email not confirmed. Please confirm your email before logging in.");
        if (!user.IsActive) throw new AppException(403, "Account is locked.");
        return await IssueTokensAsync(user);
    }

    public async Task<LoginResponse> RefreshAsync(RefreshTokenRequest request)
    {
        var hash = JwtService.HashRefreshToken(request.RefreshToken);
        var stored = await unit.RefreshTokens.Query().Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (stored is null || stored.RevokedAt is not null || stored.ExpiresAt <= DateTime.UtcNow
            || stored.User is null || !stored.User.IsActive)
            throw new AppException(401, "Invalid or expired refresh token.");

        var replacement = jwt.CreateRefreshToken();
        stored.RevokedAt = DateTime.UtcNow;
        stored.ReplacedByTokenHash = replacement.Hash;
        unit.RefreshTokens.Add(new RefreshToken
        {
            UserId = stored.UserId, TokenHash = replacement.Hash, ExpiresAt = replacement.ExpiresAt
        });
        var (access, accessExpires) = jwt.CreateAccessToken(stored.User);
        await unit.SaveChangesAsync();
        return new LoginResponse(new AuthTokensResponse(access, replacement.RawToken, accessExpires), ToDto(stored.User));
    }

    public async Task LogoutAsync(int userId, string? refreshToken)
    {
        var user = await unit.Users.FindAsync(userId) ?? throw new AppException(401, "Unauthorized.");
        user.TokenVersion++;
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            var hash = JwtService.HashRefreshToken(refreshToken);
            var stored = await unit.RefreshTokens.Query().FirstOrDefaultAsync(t => t.TokenHash == hash && t.RevokedAt == null);
            if (stored is not null) stored.RevokedAt = DateTime.UtcNow;
        }
        await unit.SaveChangesAsync();
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user is null || !user.IsActive || !user.EmailConfirmed) return;
        
        if (user.LastEmailSentAt.HasValue && (DateTime.UtcNow - user.LastEmailSentAt.Value).TotalSeconds < 60)
            return; // silent rate limit for forgot-password too to prevent spam

        user.ResetToken = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        user.ResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(15);
        await unit.SaveChangesAsync();
        await emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, user.ResetToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.Email == email);
        if (user?.ResetToken is null || user.ResetTokenExpiresAt <= DateTime.UtcNow
            || !FixedEquals(user.ResetToken, request.ResetToken))
            throw new AppException(400, "Invalid or expired reset token.");
        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        user.ResetToken = null;
        user.ResetTokenExpiresAt = null;
        user.TokenVersion++;
        await RevokeRefreshTokensAsync(user.UserId);
        await unit.SaveChangesAsync();
    }

    public async Task<LoginResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await unit.Users.FindAsync(userId) ?? throw new AppException(401, "Unauthorized.");
        if (!PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            throw new AppException(400, "Current password is incorrect.");
        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        user.TokenVersion++;
        await RevokeRefreshTokensAsync(userId);
        return await IssueTokensAsync(user);
    }

    public async Task<UserResponse> GetProfileAsync(int userId)
    {
        var user = await unit.Users.Query(false).FirstOrDefaultAsync(u => u.UserId == userId)
            ?? throw new AppException(401, "Unauthorized.");
        return ToDto(user);
    }

    public async Task<UserResponse> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.UserId == userId)
            ?? throw new AppException(401, "Unauthorized.");
        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.Phone;
        user.Address = request.Address;
        await unit.SaveChangesAsync();
        return ToDto(user);
    }

    private async Task<LoginResponse> IssueTokensAsync(User user)
    {
        var (access, accessExpires) = jwt.CreateAccessToken(user);
        var refresh = jwt.CreateRefreshToken();
        unit.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.UserId, TokenHash = refresh.Hash, ExpiresAt = refresh.ExpiresAt
        });
        await unit.SaveChangesAsync();
        return new LoginResponse(new AuthTokensResponse(access, refresh.RawToken, accessExpires), ToDto(user));
    }

    private async Task RevokeRefreshTokensAsync(int userId)
    {
        var tokens = await unit.RefreshTokens.Query().Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync();
        foreach (var token in tokens) token.RevokedAt = DateTime.UtcNow;
    }

    private static bool FixedEquals(string left, string right)
    {
        var a = System.Text.Encoding.UTF8.GetBytes(left);
        var b = System.Text.Encoding.UTF8.GetBytes(right);
        return a.Length == b.Length && CryptographicOperations.FixedTimeEquals(a, b);
    }
}
