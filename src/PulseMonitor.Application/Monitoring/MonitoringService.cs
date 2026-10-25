using Microsoft.Extensions.Logging;

namespace PulseMonitor.Application.Monitoring;

public sealed class MonitoringService(
    IMonitoringTargetRepository targetRepository,
    IServerMonitoringExecutor executor,
    ILogger<MonitoringService> logger) : IMonitoringService
{
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var servers = await targetRepository
            .GetActiveServersAsync(cancellationToken);

        logger.LogInformation(
            "Starting monitoring cycle for {ServerCount} servers",
            servers.Count);

        int failedServers = 0;

        foreach (var server in servers)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                await executor.ExecuteAsync(server, cancellationToken);

            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                failedServers++;
                logger.LogError(
                    ex,
                    "Metric collection failed for server {ServerId}",
                    server.ServerId);
            }
        }

        logger.LogInformation(
        "Monitoring cycle completed. Total={Total}, Failed={Failed}",
        servers.Count,
        failedServers);
    }
}