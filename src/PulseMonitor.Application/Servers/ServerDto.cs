namespace PulseMonitor.Application.Servers;

public sealed record ServerDto(
    int ServerId,
    string ServerName,
    string IpAddress,
    string? Description,
    bool IsActive,
    DateTime CreatedAt
);
