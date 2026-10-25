namespace PulseMonitor.Infrastructure.HealthChecks;

public static class HealthCheckTags
{
    // Checks that must pass before the instance should receive traffic.
    public const string Ready = "ready";
}
