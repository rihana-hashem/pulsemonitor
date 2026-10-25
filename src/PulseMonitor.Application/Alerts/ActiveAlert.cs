namespace PulseMonitor.Application.Alerts;

public sealed record ActiveAlert(
    long AlertId,
    string MetricType);