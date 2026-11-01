from pathlib import Path
import re

p = Path('BackEnd/SmartFarm.Services/Services/AuthService.cs')
s = p.read_text()

s = s.replace(
    '        user.Phone, user.Address, user.Role?.Name ?? RoleNames.Customer, user.IsActive, user.CreatedAt);\n',
    '        user.Phone, user.Address, user.Role?.Name ?? RoleNames.Customer, user.IsActive, user.EmailConfirmed, user.CreatedAt);\n'
)

old_reg = '''        var email = request.Email.Trim().ToLowerInvariant();
        if (await unit.Users.Query(false).AnyAsync(u => u.Email == email))
            throw new AppException(409, "Email already registered.");'''
new_reg = '''        var email = request.Email.Trim().ToLowerInvariant();
        var existing = await unit.Users.Query(false).FirstOrDefaultAsync(u => u.Email == email);
        if (existing is not null)
        {
            if (existing.EmailConfirmed)
                throw new AppException(409, "Email already registered.");
            throw new AppException(409, "Email already registered but not confirmed. Please check your inbox or resend the confirmation email.");
        }'''
s = s.replace(old_reg, new_reg)

old_reg2 = '''        unit.Users.Add(user);
        await unit.SaveChangesAsync();
        return ToDto(user);
    }'''
new_reg2 = '''        user.EmailConfirmToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.EmailConfirmTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
        user.LastEmailSentAt = DateTime.UtcNow;
        unit.Users.Add(user);
        await unit.SaveChangesAsync();
        await email.SendEmailConfirmationAsync(user.Email, user.FullName, user.UserId, user.EmailConfirmToken);
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
        await email.SendEmailConfirmationAsync(user.Email, user.FullName, user.UserId, user.EmailConfirmToken);
    }'''
s = s.replace(old_reg2, new_reg2)

old_login = '''        var user = await unit.Users.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            throw new AppException(401, "Invalid email or password.");
        if (!user.IsActive) throw new AppException(403, "Account is locked.");'''
new_login = '''        var user = await unit.Users.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            throw new AppException(401, "Invalid email or password.");
        if (!user.EmailConfirmed) throw new AppException(403, "Email not confirmed. Please confirm your email before logging in.");
        if (!user.IsActive) throw new AppException(403, "Account is locked.");'''
s = s.replace(old_login, new_login)

old_forgot = '''        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user is null || !user.IsActive) return;'''
new_forgot = '''        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await unit.Users.Query().FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user is null || !user.IsActive || !user.EmailConfirmed) return;
        
        if (user.LastEmailSentAt.HasValue && (DateTime.UtcNow - user.LastEmailSentAt.Value).TotalSeconds < 60)
            return; # silent rate limit for forgot-password too to prevent spam
'''
s = s.replace(old_forgot, new_forgot)

p.write_text(s)

# 5. Fix UserService (ToDto)
p = Path('BackEnd/SmartFarm.Services/Services/UserService.cs')
s = p.read_text()
s = s.replace(
    '        user.Phone, user.Address, user.Role?.Name ?? RoleNames.Customer, user.IsActive, user.CreatedAt);\n',
    '        user.Phone, user.Address, user.Role?.Name ?? RoleNames.Customer, user.IsActive, user.EmailConfirmed, user.CreatedAt);\n'
)
p.write_text(s)

# 6. AuthController
p = Path('BackEnd/SmartFarm.Api/Controllers/AuthController.cs')
s = p.read_text()
new_endpoints = '''    [HttpPost("confirm-email")]
    public async Task<ActionResult<ApiResponse<object>>> ConfirmEmail([FromBody] ConfirmEmailRequest request)
    {
        await service.ConfirmEmailAsync(request);
        return Ok(ApiResponse<object>.Ok(new { }, "Email confirmed successfully"));
    }

    [HttpPost("resend-confirm-email")]
    public async Task<ActionResult<ApiResponse<object>>> ResendConfirmEmail([FromBody] ResendConfirmEmailRequest request)
    {
        await service.ResendConfirmEmailAsync(request);
        return Accepted(ApiResponse<object>.Ok(new { }, "If the email is unconfirmed, a new link has been sent."));
    }

    [HttpPost("login")]'''
s = s.replace('    [HttpPost("login")]', new_endpoints)
p.write_text(s)

# 7. DbSeeder (Admin/Staff must be confirmed)
p = Path('BackEnd/SmartFarm.Api/Data/DbSeeder.cs')
s = p.read_text()
s = s.replace(
    'PasswordHash = PasswordHasher.Hash(password), RoleId = adminRole.RoleId',
    'PasswordHash = PasswordHasher.Hash(password), RoleId = adminRole.RoleId, EmailConfirmed = true'
)
s = s.replace(
    'PasswordHash = PasswordHasher.Hash(password), RoleId = staffRole.RoleId',
    'PasswordHash = PasswordHasher.Hash(password), RoleId = staffRole.RoleId, EmailConfirmed = true'
)
p.write_text(s)
