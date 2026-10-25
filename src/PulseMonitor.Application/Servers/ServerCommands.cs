namespace PulseMonitor.Application.Servers;

public sealed record CreateServerCommand(
    string ServerName,
    string IpAddress,
    string? Description);

public sealed record UpdateServerCommand(
    int ServerId,
    string ServerName,
    string IpAddress,
    string? Description,
    bool IsActive);
