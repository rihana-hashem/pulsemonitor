namespace PulseMonitor.Application.Monitoring;

public interface IServerMonitoringProcessor
{
    Task ProcessAsync(
        ServerMonitoringTarget server,
        CancellationToken cancellationToken);
}