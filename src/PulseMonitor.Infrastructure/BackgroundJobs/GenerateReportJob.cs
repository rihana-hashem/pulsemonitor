using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PulseMonitor.Application.Reports;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Reports;

namespace PulseMonitor.Infrastructure.BackgroundJobs;

/// <summary>
/// Fire-and-forget job: builds a report and stores its file. Pending -> Processing -> Completed,
/// or Failed with a message for the user.
/// </summary>
internal sealed class GenerateReportJob(
    PulseMonitorDbContext dbContext,
    ReportContentBuilder contentBuilder,
    IReportStorage storage,
    IReportService reportService,
    IReportNotifier notifier,
    TimeProvider timeProvider,
    ILogger<GenerateReportJob> logger)
{
    private const string GenericFailure =
        "Report generation failed. An administrator can retry it from the background jobs dashboard.";

    [JobDisplayName("Generate report #{0}")]
    // No automatic retries: the user sees "Failed" right away instead of waiting through retries.
    // The failed job stays in the Hangfire dashboard, where an admin can retry it.
    [AutomaticRetry(Attempts = 0)]
    public async Task ExecuteAsync(long reportId, CancellationToken cancellationToken)
    {
        // Ignore filters: a server deleted while the report was queued should fail the report
        // with a clear message, not make it invisible.
        var report = await dbContext.Reports
            .IgnoreQueryFilters()
            .Include(r => r.Server)
            .Include(r => r.RequestedByUser)
            .SingleOrDefaultAsync(r => r.ReportId == reportId, cancellationToken);

        if (report is null)
        {
            logger.LogWarning("Report {ReportId} no longer exists; nothing to generate", reportId);
            return;
        }

        report.Status = nameof(ReportStatus.Processing);
        report.ErrorMessage = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        await NotifyAsync(reportId, cancellationToken);

        try
        {
            if (report.Server.DeletedAt is not null)
                throw new ReportFailedException("The server was deleted before the report could be generated.");

            var content = await contentBuilder.BuildAsync(
                report.ReportId,
                report.ServerId,
                report.Server.ServerName,
                report.Server.IpAddress,
                report.RequestedByUser.UserName,
                report.StartDate,
                report.EndDate,
                cancellationToken);

            var fileName = $"report-{report.ReportId}.html";
            await storage.SaveAsync(fileName, HtmlReportRenderer.Render(content), cancellationToken);

            report.Status = nameof(ReportStatus.Completed);
            report.FilePath = fileName;
            report.CompletedAt = timeProvider.GetUtcNow().UtcDateTime;
            await dbContext.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Report {ReportId} generated ({Samples} readings)", reportId, content.Samples);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Users see a safe message; the details go to the log and the Hangfire dashboard.
            logger.LogError(ex, "Report {ReportId} failed", reportId);

            report.Status = nameof(ReportStatus.Failed);
            report.ErrorMessage = ex is ReportFailedException ? ex.Message : GenericFailure;
            await dbContext.SaveChangesAsync(CancellationToken.None);
            await NotifyAsync(reportId, CancellationToken.None);

            // Rethrow so Hangfire marks the job failed (retryable from the dashboard) and the
            // continuation, which only runs after success, does not run.
            throw;
        }

        await NotifyAsync(reportId, cancellationToken);
    }

    private async Task NotifyAsync(long reportId, CancellationToken cancellationToken)
    {
        try
        {
            var report = await reportService.GetAsync(reportId, null, cancellationToken);
            await notifier.ReportStatusChangedAsync(report, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A missed push only means the page updates on its next refresh.
            logger.LogWarning(ex, "Could not push the status of report {ReportId}", reportId);
        }
    }

    /// <summary>A failure whose message is safe and useful to show to the user.</summary>
    private sealed class ReportFailedException(string message) : Exception(message);
}
