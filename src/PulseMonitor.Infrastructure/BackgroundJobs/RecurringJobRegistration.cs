using Hangfire;

namespace PulseMonitor.Infrastructure.BackgroundJobs;

public static class RecurringJobRegistration
{
    public static void RegisterRecurringJobs(
        this IRecurringJobManager recurringJobManager)
    {
        recurringJobManager.AddOrUpdate<CollectMetricsJob>(
            "collect-server-metrics",
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Minutely());
    }
}