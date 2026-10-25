using Hangfire;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace PulseMonitor.Infrastructure.HealthChecks;

public sealed class HangfireHealthCheck(
    JobStorage jobStorage,
    TimeProvider timeProvider) : IHealthCheck
{
    // Servers send a heartbeat every 30 seconds by default. A crashed server stays
    // listed until the watchdog removes it (5 minutes), so judge by heartbeat age.
    private static readonly TimeSpan MaxHeartbeatAge = TimeSpan.FromMinutes(1);

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var cutoff = timeProvider.GetUtcNow().UtcDateTime - MaxHeartbeatAge;

        var liveServers = jobStorage.GetMonitoringApi()
            .Servers()
            .Count(server => server.Heartbeat >= cutoff);

        var result = liveServers > 0
            ? HealthCheckResult.Healthy(
                $"{liveServers} Hangfire server(s) running")
            : new HealthCheckResult(
                context.Registration.FailureStatus,
                "No Hangfire servers are running; background jobs will not be processed");

        return Task.FromResult(result);
    }
}
