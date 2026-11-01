using Microsoft.EntityFrameworkCore;
using SmartFarm.Repositories;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

public interface IUserService
{
    Task<PagedResponse<object>> ListAsync(QueryRequest request, string? role, bool? isActive);
    Task<UserResponse> DetailAsync(int id);
    Task<UserResponse> CreateStaffAsync(CreateStaffAccountRequest request);
    Task<UserResponse> UpdateProfileAsync(int id,AdminUpdateUserRequest request);
    Task<UserResponse> UpdateRoleAsync(int actorId, int id, UpdateUserRoleRequest request);
    Task<UserResponse> UpdateStatusAsync(int actorId, int id, UpdateUserStatusRequest request);
    Task<IReadOnlyList<object>> RolesAsync();
}

public sealed class UserService(IUnitOfWork unit) : IUserService
{
    private static UserResponse ToDto(User user) => new(user.UserId, user.Email, user.FullName,
        user.PhoneNumber, user.Address, user.Role, user.IsActive, user.EmailConfirmed, user.CreatedAt, user.AvatarUrl, user.UpdatedAt);

    public async Task<PagedResponse<object>> ListAsync(QueryRequest request, string? role, bool? isActive)
    {
        var query = unit.Users.Query(false).AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(u => u.Email.Contains(request.Search) || u.FullName.Contains(request.Search));
        if (!string.IsNullOrWhiteSpace(role)) query = query.Where(u => u.Role == role.ToUpper());
        if (isActive.HasValue) query = query.Where(u => u.IsActive == isActive.Value);
        query = request.Sort?.ToLowerInvariant() switch
        {
            "fullname" => query.OrderBy(u => u.FullName),
            "-fullname" => query.OrderByDescending(u => u.FullName),
            "email" => query.OrderBy(u => u.Email),
            "-createdat" => query.OrderByDescending(u => u.CreatedAt),
            _ => query.OrderBy(u => u.UserId)
        };
        var (page, size) = QueryHelper.Paging(request);
        var total = await query.CountAsync();
        var users = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        var items = users.Select(u => QueryHelper.SelectFields(ToDto(u), request.Fields)).ToList();
        return new PagedResponse<object>(items, page, size, total);
    }

    public async Task<UserResponse> DetailAsync(int id)
    {
        var user = await unit.Users.Query(false).FirstOrDefaultAsync(u => u.UserId == id)
            ?? throw new AppException(404, "User not found.");
        return ToDto(user);
    }

    public async Task<UserResponse> CreateStaffAsync(CreateStaffAccountRequest request)
    {
        var email=request.Email.Trim().ToLowerInvariant();if(await unit.Users.Query(false).AnyAsync(x=>x.Email==email))throw new AppException(409,"Email already registered.");var user=new User{Email=email,FullName=request.FullName.Trim(),PasswordHash=PasswordHasher.Hash(request.TemporaryPassword),PhoneNumber=request.PhoneNumber?.Trim(),Address=request.Address?.Trim(),Role=RoleNames.Staff,EmailConfirmed=true,IsActive=true,CreatedAt=DateTime.UtcNow};unit.Users.Add(user);await unit.SaveChangesAsync();return ToDto(user);
    }

    public async Task<UserResponse> UpdateProfileAsync(int id,AdminUpdateUserRequest request)
    {
        var user=await unit.Users.Query().FirstOrDefaultAsync(x=>x.UserId==id)??throw new AppException(404,"User not found.");user.FullName=request.FullName.Trim();user.PhoneNumber=request.PhoneNumber?.Trim();user.Address=request.Address?.Trim();await unit.SaveChangesAsync();return ToDto(user);
    }

    public async Task<UserResponse> UpdateRoleAsync(int actorId, int id, UpdateUserRoleRequest request)
    {
        var roleName = request.Role.Trim().ToUpperInvariant();
        if (!RoleNames.All.Contains(roleName)) throw new AppException(400, $"Invalid role: {roleName}.");
        if (actorId == id) throw new AppException(400, "You cannot change your own role.");
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.UserId == id)
            ?? throw new AppException(404, "User not found.");
        user.Role = roleName; user.TokenVersion++;
        await unit.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<UserResponse> UpdateStatusAsync(int actorId, int id, UpdateUserStatusRequest request)
    {
        if (actorId == id) throw new AppException(400, "You cannot lock your own account.");
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.UserId == id)
            ?? throw new AppException(404, "User not found.");
        user.IsActive = request.IsActive;
        if (!request.IsActive) user.TokenVersion++;
        await unit.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<IReadOnlyList<object>> RolesAsync()
    {
        var counts = await unit.Users.Query(false).GroupBy(u => u.Role).ToDictionaryAsync(g => g.Key, g => g.Count());
        return RoleNames.All.Select((name, index) => (object)new { RoleId=index+1, Name=name, UserCount=counts.GetValueOrDefault(name) }).ToList();
    }
}
