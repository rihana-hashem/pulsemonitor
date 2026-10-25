namespace PulseMonitor.Application.Servers;

public interface IServerCommandService
{

    Task<ServerDto> CreateAsync(
        CreateServerCommand command,
        CancellationToken cancellationToken = default);

    Task<ServerDto> UpdateAsync(
        UpdateServerCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Soft-deletes the server: monitoring stops and it disappears from queries,
    /// but its metric, alert and report history is kept.
    /// </summary>
    Task DeleteAsync(
        int serverId,
        CancellationToken cancellationToken = default);
}
