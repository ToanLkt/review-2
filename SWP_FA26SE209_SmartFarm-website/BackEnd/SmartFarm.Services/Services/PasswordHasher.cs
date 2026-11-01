using Microsoft.AspNetCore.Identity;

namespace SmartFarm.Services.Services;

public static class PasswordHasher
{
    private static readonly PasswordHasher<object> Hasher = new();
    private static readonly object User = new();

    public static string Hash(string password) => Hasher.HashPassword(User, password);

    public static bool Verify(string password, string stored) =>
        Hasher.VerifyHashedPassword(User, stored, password) != PasswordVerificationResult.Failed;
}
