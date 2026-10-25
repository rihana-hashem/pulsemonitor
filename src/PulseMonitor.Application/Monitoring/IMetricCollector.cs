namespace PulseMonitor.Application.Monitoring;

public interface IMetricCollector
{
    Task<ServerMetricSnapshot> CollectAsync(
        ServerMonitoringTarget server,
        CancellationToken cancellationToken);
}