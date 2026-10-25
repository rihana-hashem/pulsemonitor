using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Application.Dashboard;
using PulseMonitor.Infrastructure.Persistence;

namespace PulseMonitor.Infrastructure.Services;

public sealed class DashboardQueryService(
    PulseMonitorDbContext dbContext,
    IOptions<AlertThresholdOptions> thresholdOptions) : IDashboardQueryService
{
    public async Task<DashboardDto> GetAsync(CancellationToken cancellationToken = default)
    {
        // One query: SQL Server picks each server's latest metric and its open alerts.
        // The soft-delete filter on Servers keeps deleted servers out.
        var servers = await dbContext.Servers
            .AsNoTracking()
            .OrderBy(s => s.ServerName)
            .Select(s => new ServerOverviewDto(
                s.ServerId,
                s.ServerName,
                s.IpAddress,
                s.IsActive,
                s.Metrics
                    .OrderByDescending(m => m.CollectedAt)
                    .Select(m => new ServerReadingDto(
                        m.CollectedAt,
                        m.CpuUsage,
                        m.MemoryUsage,
                        m.DiskUsage,
                        m.ResponseTimeMs,
                        m.Status))
                    .FirstOrDefault(),
                s.Alerts
                    .Where(a => a.Status == "Triggered")
                    .OrderByDescending(a => a.TriggeredAt)
                    .Select(a => new ActiveAlertDto(
                        a.AlertId,
                        a.MetricType,
                        a.TriggerValue,
                        a.LastObservedValue,
                        a.ThresholdValue,
                        a.TriggeredAt))
                    .ToList()))
            .ToListAsync(cancellationToken);

        var thresholds = thresholdOptions.Value;

        return new DashboardDto(
            new AlertThresholdsDto(
                thresholds.CpuUsage,
                thresholds.MemoryUsage,
                thresholds.DiskUsage,
                thresholds.ResponseTimeMs),
            servers);
    }
}
