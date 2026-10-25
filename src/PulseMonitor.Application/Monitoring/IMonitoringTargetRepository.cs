namespace PulseMonitor.Application.Monitoring;

public interface IMonitoringTargetRepository
{
    Task<IReadOnlyList<ServerMonitoringTarget>> GetActiveServersAsync(
        CancellationToken cancellationToken);
}