using PulseMonitor.Application.Common.Models;

namespace PulseMonitor.Application.Alerts;

/// <summary>Alert state; matches dbo.Alerts.Status.</summary>
public enum AlertStatus
{
    Triggered,
    Resolved
}

/// <summary>The monitored values an alert can be about; matches dbo.Alerts.MetricType.</summary>
public enum AlertMetricType
{
    CpuUsage,
    MemoryUsage,
    DiskUsage,
    ResponseTimeMs
}

public enum AlertSortField
{
    TriggeredAt,
    ServerName,
    MetricType
}

/// <param name="Status">Only active (Triggered) or only Resolved alerts; null returns both.</param>
/// <param name="From">Triggered at or after (UTC, inclusive).</param>
/// <param name="To">Triggered before (UTC, exclusive).</param>
public sealed record AlertListQuery(
    AlertStatus? Status,
    int? ServerId,
    AlertMetricType? MetricType,
    DateTime? From,
    DateTime? To,
    AlertSortField SortBy,
    SortDirection SortDirection,
    int Page,
    int PageSize);

/// <param name="TriggerValue">The value that triggered the alert.</param>
/// <param name="LastObservedValue">The latest value while it was open (the value that resolved it, once resolved).</param>
public sealed record AlertListItemDto(
    long AlertId,
    int ServerId,
    string ServerName,
    string MetricType,
    string Status,
    decimal Threshold,
    decimal TriggerValue,
    decimal? LastObservedValue,
    DateTime TriggeredAt,
    DateTime? ResolvedAt);

public interface IAlertQueryService
{
    /// <summary>Alert history, filtered, sorted and paged. Alerts of deleted servers are not included.</summary>
    Task<PagedResult<AlertListItemDto>> GetPageAsync(
        AlertListQuery query,
        CancellationToken cancellationToken = default);
}
