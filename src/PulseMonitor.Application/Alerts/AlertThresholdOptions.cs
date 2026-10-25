namespace PulseMonitor.Application.Alerts;

public sealed class AlertThresholdOptions
{
    public const string SectionName = "Monitoring:Thresholds";

    public decimal CpuUsage { get; set; } = 90;
    public decimal MemoryUsage { get; set; } = 90;
    public decimal DiskUsage { get; set; } = 85;
    public decimal ResponseTimeMs { get; set; } = 400;
}