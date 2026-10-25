using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Application.Common.Models;
using PulseMonitor.Application.Metrics;
using PulseMonitor.Infrastructure.Persistence;

namespace PulseMonitor.Infrastructure.Reports;

/// <summary>One metric's figures over the report period.</summary>
internal sealed record MetricSummary(
    string Name,
    string Unit,
    double Average,
    double Minimum,
    double Maximum,
    decimal Threshold,
    int ReadingsOverThreshold);

internal sealed record ReportContent(
    long ReportId,
    string ServerName,
    string IpAddress,
    string RequestedBy,
    DateTime From,
    DateTime To,
    DateTime GeneratedAt,
    int Samples,
    IReadOnlyList<MetricSummary> Summary,
    MetricsHistoryDto History,
    PagedResult<AlertListItemDto> Alerts);

/// <summary>Collects everything a performance report shows for one server and period.</summary>
internal sealed class ReportContentBuilder(
    PulseMonitorDbContext dbContext,
    IMetricsQueryService metricsQueryService,
    IAlertQueryService alertQueryService,
    IOptions<AlertThresholdOptions> thresholdOptions,
    TimeProvider timeProvider)
{
    /// <summary>Alerts listed in a report; the total count is always shown.</summary>
    private const int MaxListedAlerts = 100;

    public async Task<ReportContent> BuildAsync(
        long reportId,
        int serverId,
        string serverName,
        string ipAddress,
        string requestedBy,
        DateTime from,
        DateTime to,
        CancellationToken cancellationToken)
    {
        var t = thresholdOptions.Value;

        // One aggregate query over the period's raw readings.
        var stats = await dbContext.Metrics
            .AsNoTracking()
            .Where(m => m.ServerId == serverId && m.CollectedAt >= from && m.CollectedAt < to)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Samples = g.Count(),
                CpuAvg = g.Average(m => (double)m.CpuUsage),
                CpuMin = g.Min(m => (double)m.CpuUsage),
                CpuMax = g.Max(m => (double)m.CpuUsage),
                CpuOver = g.Count(m => m.CpuUsage >= t.CpuUsage),
                MemAvg = g.Average(m => (double)m.MemoryUsage),
                MemMin = g.Min(m => (double)m.MemoryUsage),
                MemMax = g.Max(m => (double)m.MemoryUsage),
                MemOver = g.Count(m => m.MemoryUsage >= t.MemoryUsage),
                DiskAvg = g.Average(m => (double)m.DiskUsage),
                DiskMin = g.Min(m => (double)m.DiskUsage),
                DiskMax = g.Max(m => (double)m.DiskUsage),
                DiskOver = g.Count(m => m.DiskUsage >= t.DiskUsage),
                RtAvg = g.Average(m => (double)m.ResponseTimeMs),
                RtMin = g.Min(m => (double)m.ResponseTimeMs),
                RtMax = g.Max(m => (double)m.ResponseTimeMs),
                RtOver = g.Count(m => m.ResponseTimeMs >= t.ResponseTimeMs)
            })
            .FirstOrDefaultAsync(cancellationToken);

        var summary = stats is null
            ? []
            : new List<MetricSummary>
            {
                new("CPU usage", "%", stats.CpuAvg, stats.CpuMin, stats.CpuMax, t.CpuUsage, stats.CpuOver),
                new("Memory usage", "%", stats.MemAvg, stats.MemMin, stats.MemMax, t.MemoryUsage, stats.MemOver),
                new("Disk usage", "%", stats.DiskAvg, stats.DiskMin, stats.DiskMax, t.DiskUsage, stats.DiskOver),
                new("Response time", "ms", stats.RtAvg, stats.RtMin, stats.RtMax, t.ResponseTimeMs, stats.RtOver)
            };

        // Throws NotFoundException if the server was deleted meanwhile; the job records that as the failure.
        var history = await metricsQueryService.GetHistoryAsync(
            new MetricsHistoryQuery(serverId, from, to), cancellationToken);

        var alerts = await alertQueryService.GetPageAsync(
            new AlertListQuery(null, serverId, null, from, to, AlertSortField.TriggeredAt, SortDirection.Asc, 1, MaxListedAlerts),
            cancellationToken);

        return new ReportContent(
            reportId,
            serverName,
            ipAddress,
            requestedBy,
            from,
            to,
            timeProvider.GetUtcNow().UtcDateTime,
            stats?.Samples ?? 0,
            summary,
            history,
            alerts);
    }
}
