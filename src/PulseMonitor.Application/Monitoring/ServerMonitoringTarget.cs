namespace PulseMonitor.Application.Monitoring;

public sealed record ServerMonitoringTarget(
    int ServerId,
    string ServerName,
    string IpAddress,
    IReadOnlyList<DiskMonitoringTarget> Disks);

public sealed record DiskMonitoringTarget(
    int DiskId,
    string DriveLetter);