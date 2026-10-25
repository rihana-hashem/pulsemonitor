using PulseMonitor.Application.Common.Models;

namespace PulseMonitor.Application.Servers;

public interface IServerQueryService
{
    Task<PagedResult<ServerDto>> GetPageAsync(
        ServerListQuery query,
        CancellationToken cancellationToken = default);

    /// <exception cref="Domain.Exceptions.NotFoundException">The server does not exist or was deleted.</exception>
    Task<ServerDto> GetByIdAsync(
        int serverId,
        CancellationToken cancellationToken = default);
}
