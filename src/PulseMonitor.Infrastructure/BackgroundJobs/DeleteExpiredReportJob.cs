using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Reports;

namespace PulseMonitor.Infrastructure.BackgroundJobs;

/// <summary>Delayed job: deletes a report's file and record once its retention period is over.</summary>
internal sealed class DeleteExpiredReportJob(
    PulseMonitorDbContext dbContext,
    IReportStorage storage,
    ILogger<DeleteExpiredReportJob> logger)
{
    [JobDisplayName("Delete expired report #{0}")]
    public async Task ExecuteAsync(long reportId, CancellationToken cancellationToken)
    {
        var report = await dbContext.Reports
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(r => r.ReportId == reportId, cancellationToken);

        // Already gone (e.g. this job ran twice): nothing to do.
        if (report is null)
            return;

        if (report.FilePath is not null)
            storage.Delete(report.FilePath);

        dbContext.Reports.Remove(report);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Deleted expired report {ReportId}", reportId);
    }
}
