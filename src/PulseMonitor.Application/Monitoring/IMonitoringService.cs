namespace PulseMonitor.Application.Monitoring;

public interface IMonitoringService
{
    Task ExecuteAsync(CancellationToken cancellationToken);
}