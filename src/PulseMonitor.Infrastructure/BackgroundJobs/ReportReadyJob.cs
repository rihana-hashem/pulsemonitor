using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PulseMonitor.Application.Common.Interfaces;
using PulseMonitor.Application.Reports;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Reports;

namespace PulseMonitor.Infrastructure.BackgroundJobs;

/// <summary>
/// Continuation job: runs only after <see cref="GenerateReportJob"/> succeeded. Emails the
/// requester (simulated) and schedules the report's deletion after the retention period.
/// </summary>
internal sealed class ReportReadyJob(
    PulseMonitorDbContext dbContext,
    IEmailSender emailSender,
    IBackgroundJobClient backgroundJobs,
    IOptions<ReportOptions> options,
    ILogger<ReportReadyJob> logger)
{
    [JobDisplayName("Report #{0} ready: email and schedule cleanup")]
    public async Task ExecuteAsync(long reportId, CancellationToken cancellationToken)
    {
        var report = await dbContext.Reports
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(r => r.ReportId == reportId)
            .Select(r => new { r.Status, r.CompletedAt, r.Server.ServerName, r.RequestedByUser.Email, r.RequestedByUser.UserName })
            .SingleOrDefaultAsync(cancellationToken);

        if (report is null || report.Status != nameof(ReportStatus.Completed))
        {
            logger.LogWarning("Report {ReportId} is missing or not completed; skipping notification", reportId);
            return;
        }

        var retention = TimeSpan.FromDays(options.Value.RetentionDays);
        var expiresAt = (report.CompletedAt ?? DateTime.UtcNow) + retention;

        await emailSender.SendAsync(
            report.Email,
            $"Your PulseMonitor report for {report.ServerName} is ready",
            $"Hi {report.UserName},\n\nYour performance report for {report.ServerName} is ready. " +
            $"Open PulseMonitor > Reports to view or download it. It is available until {expiresAt:yyyy-MM-dd HH:mm} UTC.",
            cancellationToken);

        // Delayed job: delete the report once its retention period is over.
        backgroundJobs.Schedule<DeleteExpiredReportJob>(
            job => job.ExecuteAsync(reportId, CancellationToken.None),
            retention);
    }
}
