using PulseMonitor.Application.Monitoring;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Persistence.Models;

namespace PulseMonitor.Infrastructure.Monitoring;

public sealed class MetricWriter(
    PulseMonitorDbContext dbContext) : IMetricWriter
{
    public async Task SaveAsync(
        ServerMetricSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        var metric = new Metric
        {
            ServerId = snapshot.ServerId,
            CpuUsage = snapshot.CpuUsage,
            MemoryUsage = snapshot.MemoryUsage,
            DiskUsage = snapshot.DiskUsage,
            ResponseTimeMs = snapshot.ResponseTimeMs,
            Status = snapshot.Status,
            CollectedAt = snapshot.CollectedAt
        };

        var diskMetrics = snapshot.Disks.Select(disk => new DiskMetric
        {
            DiskId = disk.DiskId,
            TotalSpaceMb = disk.TotalSpaceMB,
            FreeSpaceMb = disk.FreeSpaceMB,
            UsedPercentage = disk.UsedPercentage,
            CollectedAt = snapshot.CollectedAt
        }).ToList();

        dbContext.Metrics.Add(metric);
        dbContext.DiskMetrics.AddRange(diskMetrics);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}