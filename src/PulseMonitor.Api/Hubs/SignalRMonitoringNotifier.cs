using Microsoft.AspNetCore.SignalR;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Application.Metrics;
using PulseMonitor.Application.Monitoring;

namespace PulseMonitor.Api.Hubs;

/// <summary>Sends monitoring events through <see cref="MonitoringHub"/>.</summary>
/// <remarks>
/// The metrics job runs in this same process, so IHubContext reaches every connection. If the
/// job moved to a separate process, a SignalR backplane (e.g. Redis) would be needed.
/// </remarks>
public sealed class SignalRMonitoringNotifier(
    IHubContext<MonitoringHub, IMonitoringClient> hub) : IMonitoringNotifier
{
    public async Task MetricsCollectedAsync(
        ServerMonitoringTarget server,
        ServerMetricSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        var driveLetters = server.Disks.ToDictionary(d => d.DiskId, d => d.DriveLetter);

        var metrics = new LatestMetricsDto(
            snapshot.CollectedAt,
            snapshot.CpuUsage,
            snapshot.MemoryUsage,
            snapshot.DiskUsage,
            snapshot.ResponseTimeMs,
            snapshot.Status,
            snapshot.Disks
                .Select(d => new DiskUsageDto(
                    d.DiskId,
                    driveLetters.GetValueOrDefault(d.DiskId, "?"),
                    d.TotalSpaceMB,
                    d.FreeSpaceMB,
                    d.UsedPercentage,
                    snapshot.CollectedAt))
                .OrderBy(d => d.DriveLetter)
                .ToList());

        await hub.Clients
            .Group(MonitoringHub.ServerGroup(server.ServerId))
            .ServerMetricsUpdated(new ServerMetricsUpdate(server.ServerId, metrics));

        await hub.Clients
            .Group(MonitoringHub.DashboardGroup)
            .DashboardMetricsUpdated(new ServerMetricsSummary(
                server.ServerId,
                server.ServerName,
                snapshot.CollectedAt,
                snapshot.CpuUsage,
                snapshot.MemoryUsage,
                snapshot.DiskUsage,
                snapshot.ResponseTimeMs,
                snapshot.Status));
    }

    public async Task AlertsChangedAsync(
        ServerMonitoringTarget server,
        IReadOnlyList<AlertChange> changes,
        CancellationToken cancellationToken)
    {
        foreach (var change in changes)
        {
            await hub.Clients.All.AlertChanged(new AlertNotification(
                server.ServerId,
                server.ServerName,
                change.MetricType,
                change.ChangeType == AlertChangeType.Resolve ? "Resolved" : "Triggered",
                change.ObservedValue,
                change.Threshold,
                change.ObservedAt));
        }
    }
}
