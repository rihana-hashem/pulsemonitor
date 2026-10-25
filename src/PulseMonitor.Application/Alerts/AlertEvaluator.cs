using Microsoft.Extensions.Options;
using PulseMonitor.Application.Monitoring;
using PulseMonitor.Domain.Alerts;

namespace PulseMonitor.Application.Alerts;

public sealed class AlertEvaluator(
    IAlertRepository alertRepository,
    IOptions<AlertThresholdOptions> options) : IAlertEvaluator
{
    public async Task<IReadOnlyList<AlertChange>> EvaluateAsync(
        ServerMetricSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        var thresholds = options.Value;

        var activeAlerts = await alertRepository.GetActiveAlertsAsync(
            snapshot.ServerId,
            cancellationToken);

        var activeByType = activeAlerts.ToDictionary(
            a => a.MetricType,
            StringComparer.OrdinalIgnoreCase);

        var measurements = new[]
        {
            ("CpuUsage", snapshot.CpuUsage, thresholds.CpuUsage),
            ("MemoryUsage", snapshot.MemoryUsage, thresholds.MemoryUsage),
            ("DiskUsage", snapshot.DiskUsage, thresholds.DiskUsage),
            ("ResponseTimeMs", (decimal)snapshot.ResponseTimeMs,
                thresholds.ResponseTimeMs)
        };

        var changes = new List<AlertChange>();

        foreach (var (metricType, value, threshold) in measurements)
        {
            activeByType.TryGetValue(metricType, out var activeAlert);

            var action = AlertPolicy.Evaluate(
                value,
                threshold,
                activeAlert is not null);

            if (action == AlertAction.None && activeAlert is null)
                continue;

            var changeType = action switch
            {
                AlertAction.Trigger => AlertChangeType.Trigger,
                AlertAction.Resolve => AlertChangeType.Resolve,
                _ => AlertChangeType.Observe
            };

            changes.Add(new AlertChange(
                changeType,
                activeAlert?.AlertId,
                snapshot.ServerId,
                metricType,
                threshold,
                value,
                snapshot.CollectedAt));
        }

        if (changes.Count > 0)
        {
            await alertRepository.ApplyChangesAsync(
                changes,
                cancellationToken);
        }

        return changes;
    }
}