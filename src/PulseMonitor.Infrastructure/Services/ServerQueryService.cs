using Microsoft.EntityFrameworkCore;
using PulseMonitor.Application.Common.Models;
using PulseMonitor.Application.Servers;
using PulseMonitor.Domain.Exceptions;
using PulseMonitor.Infrastructure.Persistence;

namespace PulseMonitor.Infrastructure.Services;

public sealed class ServerQueryService(
    PulseMonitorDbContext dbContext) : IServerQueryService
{
    public async Task<PagedResult<ServerDto>> GetPageAsync(
        ServerListQuery query,
        CancellationToken cancellationToken = default)
    {
        var servers = dbContext.Servers.AsNoTracking();

        var search = query.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            servers = servers.Where(s =>
                s.ServerName.Contains(search) ||
                s.IpAddress.Contains(search));
        }

        if (query.IsActive is { } isActive)
        {
            servers = servers.Where(s => s.IsActive == isActive);
        }

        var ordered = query.SortBy switch
        {
            ServerSortField.IpAddress => servers.OrderByDirection(s => s.IpAddress, query.SortDirection),
            ServerSortField.CreatedAt => servers.OrderByDirection(s => s.CreatedAt, query.SortDirection),
            _ => servers.OrderByDirection(s => s.ServerName, query.SortDirection)
        };

        return await ordered
            // Unique tie-breaker so rows with equal sort values keep a stable order across pages.
            .ThenBy(s => s.ServerId)
            .Select(s => new ServerDto(
                s.ServerId,
                s.ServerName,
                s.IpAddress,
                s.Description,
                s.IsActive,
                s.CreatedAt))
            .ToPagedResultAsync(query.Page, query.PageSize, cancellationToken);
    }

    public async Task<ServerDto> GetByIdAsync(
        int serverId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Servers
            .AsNoTracking()
            .Where(s => s.ServerId == serverId)
            .Select(s => new ServerDto(
                s.ServerId,
                s.ServerName,
                s.IpAddress,
                s.Description,
                s.IsActive,
                s.CreatedAt))
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Server", serverId);
    }
}
