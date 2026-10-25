using Microsoft.Extensions.Logging;
using PulseMonitor.Application.Common.Interfaces;

namespace PulseMonitor.Infrastructure.Services;

/// <summary>
/// Simulated email (the assessment does not require real delivery): the message is written to
/// the log. Replace with an SMTP or email-API implementation of <see cref="IEmailSender"/> to send.
/// </summary>
public sealed class LogEmailSender(ILogger<LogEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken)
    {
        logger.LogInformation("Simulated email to {To}: {Subject}", to, subject);
        logger.LogDebug("Simulated email body: {Body}", body);
        return Task.CompletedTask;
    }
}
