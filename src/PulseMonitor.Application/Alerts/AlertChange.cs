namespace PulseMonitor.Application.Alerts;

public enum AlertChangeType
{
    Trigger,
    Observe,
    Resolve
}

public sealed record AlertChange(
    AlertChangeType ChangeType,
    long? AlertId,
    int ServerId,
    string MetricType,
    decimal Threshold,
    decimal ObservedValue,
    DateTime ObservedAt);