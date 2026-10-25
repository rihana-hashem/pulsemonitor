using PulseMonitor.Application.Common.Models;

namespace PulseMonitor.Application.Servers;

public enum ServerSortField
{
    Name,
    IpAddress,
    CreatedAt
}

/// <param name="Search">Matches part of the server name or IP address.</param>
/// <param name="IsActive">Only active or only inactive servers; null returns both.</param>
public sealed record ServerListQuery(
    string? Search,
    bool? IsActive,
    ServerSortField SortBy,
    SortDirection SortDirection,
    int Page,
    int PageSize);
