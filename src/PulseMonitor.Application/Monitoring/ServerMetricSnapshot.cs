namespace PulseMonitor.Application.Monitoring;

public sealed record ServerMetricSnapshot(
    int ServerId,
    decimal CpuUsage,
    decimal MemoryUsage,
    decimal DiskUsage,
    int ResponseTimeMs,
    string Status,
    DateTime CollectedAt,
    IReadOnlyList<DiskMetricSnapshot> Disks);

public sealed record DiskMetricSnapshot(
    int DiskId,
    long TotalSpaceMB,
    long FreeSpaceMB,
    decimal UsedPercentage);