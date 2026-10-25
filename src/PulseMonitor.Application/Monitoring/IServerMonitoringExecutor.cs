namespace PulseMonitor.Application.Monitoring;

public interface IServerMonitoringExecutor
{
    Task ExecuteAsync(
        ServerMonitoringTarget server,
        CancellationToken cancellationToken);
}