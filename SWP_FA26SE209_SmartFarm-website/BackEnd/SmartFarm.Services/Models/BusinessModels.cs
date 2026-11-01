namespace SmartFarm.Services.Models;

public sealed record RentalPrice(decimal UnitPrice, int Quantity)
{
    public decimal Total => UnitPrice * Quantity;
}

public sealed record TokenIdentity(int UserId, string Email, string Role, int TokenVersion);
