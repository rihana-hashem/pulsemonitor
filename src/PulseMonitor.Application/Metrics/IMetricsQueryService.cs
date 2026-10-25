namespace PulseMonitor.Application.Metrics;

public interface IMetricsQueryService
{
    /// <summary>Metrics in the time range, aggregated into buckets (see <see cref="MetricBuckets"/>).</summary>
    /// <exception cref="Domain.Exceptions.NotFoundException">The server does not exist or was deleted.</exception>
    Task<MetricsHistoryDto> GetHistoryAsync(
        MetricsHistoryQuery query,
        CancellationToken cancellationToken = default);

    /// <summary>The latest metrics, or null when none have been collected yet.</summary>
    /// <exception cref="Domain.Exceptions.NotFoundException">The server does not exist or was deleted.</exception>
    Task<LatestMetricsDto?> GetLatestAsync(
        int serverId,
        CancellationToken cancellationToken = default);
}
