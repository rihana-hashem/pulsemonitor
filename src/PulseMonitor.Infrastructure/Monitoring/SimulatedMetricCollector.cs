using PulseMonitor.Application.Monitoring;

namespace PulseMonitor.Infrastructure.Monitoring;

public sealed class SimulatedMetricCollector : IMetricCollector
{
    public Task<ServerMetricSnapshot> CollectAsync(
        ServerMonitoringTarget server,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var diskMetrics = server.Disks
            .Select(disk =>
            {
                long totalSpaceMb = 100_000;
                decimal usedPercentage = Random.Shared.Next(10, 96);

                long freeSpaceMb = (long)(
                    totalSpaceMb * (100 - usedPercentage) / 100m);

                return new DiskMetricSnapshot(
                    disk.DiskId,
                    totalSpaceMb,
                    freeSpaceMb,
                    usedPercentage);
            })
            .ToList();

        long totalCapacity = diskMetrics.Sum(d => d.TotalSpaceMB);
        long totalFree = diskMetrics.Sum(d => d.FreeSpaceMB);

        decimal diskUsage = totalCapacity > 0
            ? Math.Round(
                (totalCapacity - totalFree) * 100m / totalCapacity,
                2)
            : 0m;

        var snapshot = new ServerMetricSnapshot(
            ServerId: server.ServerId,
            CpuUsage: Random.Shared.Next(5, 96),
            MemoryUsage: Random.Shared.Next(10, 96),
            DiskUsage: diskUsage,
            ResponseTimeMs: Random.Shared.Next(10, 501),
            Status: "Online",
            CollectedAt: DateTime.UtcNow,
            Disks: diskMetrics);

        return Task.FromResult(snapshot);
    }
}