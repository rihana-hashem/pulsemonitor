using Microsoft.Extensions.Logging;
using PulseMonitor.Application.Alerts;

namespace PulseMonitor.Application.Monitoring;

public sealed class ServerMonitoringProcessor(
    IMetricCollector metricCollector,
    IMetricWriter metricWriter,
    IAlertEvaluator alertEvaluator,
    IMonitoringNotifier notifier,
    ILogger<ServerMonitoringProcessor> logger)
    : IServerMonitoringProcessor
{
    public async Task ProcessAsync(
        ServerMonitoringTarget server,
        CancellationToken cancellationToken)
    {
        var snapshot = await metricCollector.CollectAsync(
            server,
            cancellationToken);


        logger.LogInformation(
            "Server {ServerId}: CPU={Cpu}%, Memory={Memory}%, Disk={Disk}%, ResponseTime={ResponseTime}ms, Disks={DiskCount}",
            snapshot.ServerId,
            snapshot.CpuUsage,
            snapshot.MemoryUsage,
            snapshot.DiskUsage,
            snapshot.ResponseTimeMs,
            snapshot.Disks.Count);

        await metricWriter.SaveAsync(snapshot, cancellationToken);

        logger.LogInformation(
        "Metrics saved successfully for server {ServerId} at {CollectedAt}",
        snapshot.ServerId,
        snapshot.CollectedAt);

        var alertChanges = await alertEvaluator.EvaluateAsync(snapshot, cancellationToken);

        await NotifyAsync(server, snapshot, alertChanges, cancellationToken);

        logger.LogInformation(
            "Monitoring completed for server {ServerId}",
            server.ServerId);
    }

    private async Task NotifyAsync(
        ServerMonitoringTarget server,
        ServerMetricSnapshot snapshot,
        IReadOnlyList<AlertChange> alertChanges,
        CancellationToken cancellationToken)
    {
        // The data is already saved; a failed push must not fail the job or trigger a retry.
        try
        {
            await notifier.MetricsCollectedAsync(server, snapshot, cancellationToken);

            var announced = alertChanges
                .Where(c => c.ChangeType != AlertChangeType.Observe)
                .ToList();

            if (announced.Count > 0)
                await notifier.AlertsChangedAsync(server, announced, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not push monitoring updates for server {ServerId}", server.ServerId);
        }
    }
}
