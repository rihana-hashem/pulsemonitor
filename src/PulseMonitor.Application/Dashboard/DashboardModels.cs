namespace PulseMonitor.Application.Dashboard;

/// <summary>Everything the dashboard shows, in one response.</summary>
public sealed record DashboardDto(
    AlertThresholdsDto Thresholds,
    IReadOnlyList<ServerOverviewDto> Servers);

/// <summary>The limits at which an alert is triggered (configured under Monitoring:Thresholds).</summary>
public sealed record AlertThresholdsDto(
    decimal CpuUsage,
    decimal MemoryUsage,
    decimal DiskUsage,
    decimal ResponseTimeMs);

/// <param name="LatestReading">Null when no metrics have been collected yet.</param>
public sealed record ServerOverviewDto(
    int ServerId,
    string ServerName,
    string IpAddress,
    bool IsActive,
    ServerReadingDto? LatestReading,
    IReadOnlyList<ActiveAlertDto> ActiveAlerts);

public sealed record ServerReadingDto(
    DateTime CollectedAt,
    decimal CpuUsage,
    decimal MemoryUsage,
    decimal DiskUsage,
    int ResponseTimeMs,
    string Status);

/// <param name="MetricType">"CpuUsage", "MemoryUsage", "DiskUsage" or "ResponseTimeMs".</param>
/// <param name="TriggerValue">The value that triggered the alert.</param>
/// <param name="LastObservedValue">The most recent value while the alert is open.</param>
public sealed record ActiveAlertDto(
    long AlertId,
    string MetricType,
    decimal TriggerValue,
    decimal? LastObservedValue,
    decimal Threshold,
    DateTime TriggeredAt);
