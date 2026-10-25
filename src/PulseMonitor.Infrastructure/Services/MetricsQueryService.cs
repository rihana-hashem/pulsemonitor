using Microsoft.EntityFrameworkCore;
using PulseMonitor.Application.Metrics;
using PulseMonitor.Domain.Exceptions;
using PulseMonitor.Infrastructure.Persistence;

namespace PulseMonitor.Infrastructure.Services;

public sealed class MetricsQueryService(
    PulseMonitorDbContext dbContext) : IMetricsQueryService
{
    public async Task<MetricsHistoryDto> GetHistoryAsync(
        MetricsHistoryQuery query,
        CancellationToken cancellationToken = default)
    {
        await EnsureServerExistsAsync(query.ServerId, cancellationToken);

        var bucketMinutes = MetricBuckets.ChooseSizeInMinutes(query.To - query.From);
        var origin = MetricBuckets.Origin;

        // Aggregated by SQL Server: one row per bucket instead of one per minute. The range
        // filter uses IX_Metrics_ServerId_CollectedAt.
        var buckets = await dbContext.Metrics
            .AsNoTracking()
            .Where(m => m.ServerId == query.ServerId &&
                        m.CollectedAt >= query.From &&
                        m.CollectedAt < query.To)
            .GroupBy(m => EF.Functions.DateDiffMinute(origin, m.CollectedAt) / bucketMinutes)
            .Select(g => new
            {
                Bucket = g.Key,
                CpuAvg = g.Average(m => m.CpuUsage),
                CpuMax = g.Max(m => m.CpuUsage),
                MemoryAvg = g.Average(m => m.MemoryUsage),
                MemoryMax = g.Max(m => m.MemoryUsage),
                DiskAvg = g.Average(m => m.DiskUsage),
                DiskMax = g.Max(m => m.DiskUsage),
                ResponseTimeAvg = g.Average(m => (double)m.ResponseTimeMs),
                ResponseTimeMax = g.Max(m => m.ResponseTimeMs),
                Samples = g.Count()
            })
            .OrderBy(b => b.Bucket)
            .ToListAsync(cancellationToken);

        var points = buckets
            .Select(b => new MetricPointDto(
                origin.AddMinutes((double)b.Bucket * bucketMinutes),
                Math.Round(b.CpuAvg, 2),
                b.CpuMax,
                Math.Round(b.MemoryAvg, 2),
                b.MemoryMax,
                Math.Round(b.DiskAvg, 2),
                b.DiskMax,
                Math.Round(b.ResponseTimeAvg, 1),
                b.ResponseTimeMax,
                b.Samples))
            .ToList();

        return new MetricsHistoryDto(query.ServerId, query.From, query.To, bucketMinutes, points);
    }

    public async Task<LatestMetricsDto?> GetLatestAsync(
        int serverId,
        CancellationToken cancellationToken = default)
    {
        await EnsureServerExistsAsync(serverId, cancellationToken);

        var latest = await dbContext.Metrics
            .AsNoTracking()
            .Where(m => m.ServerId == serverId)
            .OrderByDescending(m => m.CollectedAt)
            .Select(m => new { m.CollectedAt, m.CpuUsage, m.MemoryUsage, m.DiskUsage, m.ResponseTimeMs, m.Status })
            .FirstOrDefaultAsync(cancellationToken);

        if (latest is null)
            return null;

        // Latest reading of each active disk.
        var disks = await dbContext.Disks
            .AsNoTracking()
            .Where(d => d.ServerId == serverId && d.IsActive)
            .OrderBy(d => d.DriveLetter)
            .Select(d => new
            {
                d.DiskId,
                d.DriveLetter,
                Latest = d.DiskMetrics
                    .OrderByDescending(dm => dm.CollectedAt)
                    .Select(dm => new { dm.TotalSpaceMb, dm.FreeSpaceMb, dm.UsedPercentage, dm.CollectedAt })
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return new LatestMetricsDto(
            latest.CollectedAt,
            latest.CpuUsage,
            latest.MemoryUsage,
            latest.DiskUsage,
            latest.ResponseTimeMs,
            latest.Status,
            disks
                .Where(d => d.Latest is not null)
                .Select(d => new DiskUsageDto(
                    d.DiskId,
                    d.DriveLetter,
                    d.Latest!.TotalSpaceMb,
                    d.Latest.FreeSpaceMb,
                    d.Latest.UsedPercentage,
                    d.Latest.CollectedAt))
                .ToList());
    }

    private async Task EnsureServerExistsAsync(int serverId, CancellationToken cancellationToken)
    {
        // The soft-delete filter applies, so a deleted server's history is not returned.
        if (!await dbContext.Servers.AnyAsync(s => s.ServerId == serverId, cancellationToken))
            throw new NotFoundException("Server", serverId);
    }
}
