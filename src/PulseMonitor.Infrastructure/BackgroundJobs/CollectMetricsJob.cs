using Hangfire;
using PulseMonitor.Application.Monitoring;

namespace PulseMonitor.Infrastructure.BackgroundJobs;

public sealed class CollectMetricsJob(
    IMonitoringService monitoringService)
{
    [DisableConcurrentExecution(timeoutInSeconds: 60)]
    public Task ExecuteAsync(CancellationToken cancellationToken)
    {
        return monitoringService.ExecuteAsync(cancellationToken);
    }
}