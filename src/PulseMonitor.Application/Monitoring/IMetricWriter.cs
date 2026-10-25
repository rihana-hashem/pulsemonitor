namespace PulseMonitor.Application.Monitoring;

public interface IMetricWriter
{
    Task SaveAsync(
        ServerMetricSnapshot snapshot,
        CancellationToken cancellationToken);
}