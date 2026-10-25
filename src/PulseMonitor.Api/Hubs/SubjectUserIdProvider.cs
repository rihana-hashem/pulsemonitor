using Microsoft.AspNetCore.SignalR;

namespace PulseMonitor.Api.Hubs;

/// <summary>
/// Identifies SignalR users by the JWT "sub" claim. The default provider reads the long
/// NameIdentifier claim type, which our tokens don't use (inbound claim mapping is off).
/// </summary>
public sealed class SubjectUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) =>
        connection.User?.FindFirst("sub")?.Value;
}
