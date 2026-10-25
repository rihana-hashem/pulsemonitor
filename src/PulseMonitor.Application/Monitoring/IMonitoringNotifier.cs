using PulseMonitor.Application.Alerts;

namespace PulseMonitor.Application.Monitoring;

/// <summary>
/// Pushes monitoring events to connected clients (implemented with SignalR in the API).
/// Called by the metrics job after the data is saved.
/// </summary>
public interface IMonitoringNotifier
{
    Task MetricsCollectedAsync(
        ServerMonitoringTarget server,
        ServerMetricSnapshot snapshot,
        CancellationToken cancellationToken);

    /// <summary>Only alerts that were triggered or resolved; ongoing ones are not re-announced.</summary>
    Task AlertsChangedAsync(
        ServerMonitoringTarget server,
        IReadOnlyList<AlertChange> changes,
        CancellationToken cancellationToken);
}
