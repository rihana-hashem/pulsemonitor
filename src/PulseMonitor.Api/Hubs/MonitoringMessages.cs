using PulseMonitor.Application.Metrics;
using PulseMonitor.Application.Reports;

namespace PulseMonitor.Api.Hubs;

/// <summary>Full reading for one server, sent to that server's group (same shape as GET .../metrics/latest).</summary>
public sealed record ServerMetricsUpdate(
    int ServerId,
    LatestMetricsDto Metrics);

/// <summary>Compact reading sent to the dashboard group for every server.</summary>
public sealed record ServerMetricsSummary(
    int ServerId,
    string ServerName,
    DateTime CollectedAt,
    decimal CpuUsage,
    decimal MemoryUsage,
    decimal DiskUsage,
    int ResponseTimeMs,
    string Status);

/// <param name="Status">"Triggered" or "Resolved".</param>
/// <param name="MetricType">"CpuUsage", "MemoryUsage", "DiskUsage" or "ResponseTimeMs".</param>
public sealed record AlertNotification(
    int ServerId,
    string ServerName,
    string MetricType,
    string Status,
    decimal Value,
    decimal Threshold,
    DateTime OccurredAt);

public sealed record OnlineUser(
    int UserId,
    string UserName);

/// <summary>Methods the server calls on connected clients. The method name is the client event name.</summary>
public interface IMonitoringClient
{
    Task ServerMetricsUpdated(ServerMetricsUpdate update);

    Task DashboardMetricsUpdated(ServerMetricsSummary summary);

    Task AlertChanged(AlertNotification alert);

    Task PresenceChanged(IReadOnlyList<OnlineUser> users);

    /// <summary>Sent only to the user who requested the report.</summary>
    Task ReportStatusChanged(ReportDto report);
}
