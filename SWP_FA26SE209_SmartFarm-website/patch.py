from pathlib import Path

# 1. Update Models
p = Path('BackEnd/SmartFarm.Repositories/Entities/Models.cs')
s = p.read_text()
s = s.replace(
    '    public int TokenVersion { get; set; }\n',
    '    public int TokenVersion { get; set; }\n'
    '    public bool EmailConfirmed { get; set; } = false;\n'
    '    [System.ComponentModel.DataAnnotations.MaxLength(100)] public string? EmailConfirmToken { get; set; }\n'
    '    public DateTime? EmailConfirmTokenExpiresAt { get; set; }\n'
    '    public DateTime? LastEmailSentAt { get; set; }\n'
)
p.write_text(s)

# 2. Update DTOs
p = Path('BackEnd/SmartFarm.Services/Models/Dtos.cs')
s = p.read_text()
s = s.replace(
    'public record UpdateUserStatusRequest(bool IsActive);',
    'public record UpdateUserStatusRequest(bool IsActive);\n\n'
    'public record ConfirmEmailRequest(\n    [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.EmailAddress] string Email,\n    [System.ComponentModel.DataAnnotations.Required] string Token);\n\n'
    'public record ResendConfirmEmailRequest(\n    [System.ComponentModel.DataAnnotations.Required, System.ComponentModel.DataAnnotations.EmailAddress] string Email);'
)
s = s.replace(
    'public UserResponse(int userId, string email, string fullName, string? phone, string? address, string role, bool isActive, DateTime createdAt)',
    'public UserResponse(int userId, string email, string fullName, string? phone, string? address, string role, bool isActive, bool emailConfirmed, DateTime createdAt)'
)
s = s.replace(
    '{ UserId=userId; Email=email; FullName=fullName; Phone=phone; Address=address; Role=role; IsActive=isActive; CreatedAt=createdAt; }',
    '{ UserId=userId; Email=email; FullName=fullName; Phone=phone; Address=address; Role=role; IsActive=isActive; EmailConfirmed=emailConfirmed; CreatedAt=createdAt; }'
)
s = s.replace(
    'public bool IsActive { get; set; } public DateTime CreatedAt { get; set; }',
    'public bool IsActive { get; set; } public bool EmailConfirmed { get; set; }\n    public DateTime CreatedAt { get; set; }'
)
p.write_text(s)

# 3. Update IEmailService
p = Path('BackEnd/SmartFarm.Services/Services/EmailService.cs')
s = p.read_text()
s = s.replace(
    '    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken);\n',
    '    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken);\n'
    '    Task SendEmailConfirmationAsync(string toEmail, string toName, int userId, string token);\n'
)
old_email = '''    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken)'''
new_email = '''    public async Task SendEmailConfirmationAsync(string toEmail, string toName, int userId, string token)
    {
        if (!options.IsConfigured)
        {
            logger.LogInformation("Email confirm token for {Email}: userId={UserId} token={Token}", toEmail, userId, token);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.User));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "SmartFarm - Xác nhận địa chỉ email";
        message.Body = new TextPart("html")
        {
            Text = $"""
                <p>Xin chào {toName},</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản SmartFarm.</p>
                <p>Vui lòng click vào link sau để xác nhận email (hết hạn sau 30 phút):</p>
                <p><a href="http://localhost:3000/confirm-email?userId={userId}&token={token}">Xác nhận Email</a></p>
                <p>Nếu bạn không đăng ký, vui lòng bỏ qua email này.</p>
                """
        };

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(options.Host, options.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(options.User, options.Password);
            await client.SendAsync(message);
        }
        finally { await client.DisconnectAsync(true); }
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken)'''
s = s.replace(old_email, new_email)
p.write_text(s)

# 4. Update AuthService interface
p = Path('BackEnd/SmartFarm.Services/Services/AuthService.cs')
s = p.read_text()
s = s.replace(
    '    Task<UserResponse> RegisterAsync(RegisterRequest request);\n',
    '    Task<UserResponse> RegisterAsync(RegisterRequest request);\n'
    '    Task ConfirmEmailAsync(ConfirmEmailRequest request);\n'
    '    Task ResendConfirmEmailAsync(ResendConfirmEmailRequest request);\n'
)
p.write_text(s)
