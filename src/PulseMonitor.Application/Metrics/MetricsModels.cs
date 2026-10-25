namespace PulseMonitor.Application.Metrics;

/// <param name="From">Inclusive, UTC.</param>
/// <param name="To">Exclusive, UTC.</param>
public sealed record MetricsHistoryQuery(
    int ServerId,
    DateTime From,
    DateTime To);

/// <summary>Average and maximum of the raw metrics collected within one bucket.</summary>
/// <param name="Timestamp">Start of the bucket, UTC.</param>
/// <param name="Samples">How many raw metrics the bucket contains.</param>
public sealed record MetricPointDto(
    DateTime Timestamp,
    decimal CpuAvg,
    decimal CpuMax,
    decimal MemoryAvg,
    decimal MemoryMax,
    decimal DiskAvg,
    decimal DiskMax,
    double ResponseTimeAvg,
    int ResponseTimeMax,
    int Samples);

/// <param name="Points">Only buckets that contain data; gaps mean no metrics were collected.</param>
public sealed record MetricsHistoryDto(
    int ServerId,
    DateTime From,
    DateTime To,
    int BucketMinutes,
    IReadOnlyList<MetricPointDto> Points);

public sealed record DiskUsageDto(
    int DiskId,
    string DriveLetter,
    long TotalSpaceMB,
    long FreeSpaceMB,
    decimal UsedPercentage,
    DateTime CollectedAt);

/// <summary>The most recent snapshot of a server.</summary>
public sealed record LatestMetricsDto(
    DateTime CollectedAt,
    decimal CpuUsage,
    decimal MemoryUsage,
    decimal DiskUsage,
    int ResponseTimeMs,
    string Status,
    IReadOnlyList<DiskUsageDto> Disks);
