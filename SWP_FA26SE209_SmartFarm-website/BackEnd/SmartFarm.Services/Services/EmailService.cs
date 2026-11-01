using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace SmartFarm.Services.Services;

public class SmtpOptions
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string User { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromName { get; set; } = "SmartFarm";
    // When false (no credentials configured), emails are logged instead of sent.
    public bool IsConfigured => !string.IsNullOrWhiteSpace(User) && !string.IsNullOrWhiteSpace(Password);
}

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken);
    Task SendEmailConfirmationAsync(string toEmail, string toName, int userId, string token);
}

public sealed class EmailService(SmtpOptions options, ILogger<EmailService> logger) : IEmailService
{
    public async Task SendEmailConfirmationAsync(string toEmail, string toName, int userId, string token)
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

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken)
    {
        if (!options.IsConfigured)
        {
            // ponytail: no SMTP configured; log so local development still works without real email.
            logger.LogInformation("Password reset token for {Email}: {Token}", toEmail, resetToken);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.User));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "SmartFarm - Yêu cầu đặt lại mật khẩu";
        message.Body = new TextPart("html")
        {
            Text = $"""
                <p>Xin chào {toName},</p>
                <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản SmartFarm.</p>
                <p>Mã xác nhận của bạn (hết hạn sau 15 phút):</p>
                <p style="font-size:20px;font-weight:bold;letter-spacing:2px">{resetToken}</p>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                """
        };

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(options.Host, options.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(options.User, options.Password);
            await client.SendAsync(message);
        }
        finally
        {
            await client.DisconnectAsync(true);
        }
    }
}
