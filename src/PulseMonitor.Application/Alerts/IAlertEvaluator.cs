using PulseMonitor.Application.Monitoring;

namespace PulseMonitor.Application.Alerts;

public interface IAlertEvaluator
{
    /// <summary>Applies the thresholds and returns the alert changes it saved.</summary>
    Task<IReadOnlyList<AlertChange>> EvaluateAsync(
        ServerMetricSnapshot snapshot,
        CancellationToken cancellationToken);
}