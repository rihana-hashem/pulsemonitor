using System.Linq.Expressions;
using System.Text.RegularExpressions;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PulseMonitor.Application.Common.Models;
using PulseMonitor.Application.Reports;
using PulseMonitor.Domain.Exceptions;
using PulseMonitor.Infrastructure.BackgroundJobs;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Persistence.Models;

namespace PulseMonitor.Infrastructure.Reports;

internal sealed partial class ReportService(
    PulseMonitorDbContext dbContext,
    IBackgroundJobClient backgroundJobs,
    IReportStorage storage,
    IOptions<ReportOptions> options,
    TimeProvider timeProvider) : IReportService
{
    public async Task<ReportDto> RequestAsync(
        RequestReportCommand command,
        CancellationToken cancellationToken = default)
    {
        // The soft-delete filter applies: deleted servers cannot be reported on.
        if (!await dbContext.Servers.AnyAsync(s => s.ServerId == command.ServerId, cancellationToken))
            throw new NotFoundException("Server", command.ServerId);

        var report = new Report
        {
            ServerId = command.ServerId,
            RequestedByUserId = command.RequestedByUserId,
            StartDate = command.From,
            EndDate = command.To,
            Status = nameof(ReportStatus.Pending),
            CreatedAt = timeProvider.GetUtcNow().UtcDateTime
        };

        dbContext.Reports.Add(report);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Fire-and-forget: generate in the background...
        var generateJobId = backgroundJobs.Enqueue<GenerateReportJob>(
            job => job.ExecuteAsync(report.ReportId, CancellationToken.None));

        // ...then, only if generation succeeded, notify the user and schedule cleanup (continuation).
        backgroundJobs.ContinueJobWith<ReportReadyJob>(
            generateJobId,
            job => job.ExecuteAsync(report.ReportId, CancellationToken.None));

        return await GetAsync(report.ReportId, null, cancellationToken);
    }

    public async Task<PagedResult<ReportDto>> GetPageAsync(
        ReportListQuery query,
        CancellationToken cancellationToken = default)
    {
        var reports = Visible(query.OwnerUserId);

        if (query.Status is { } status)
        {
            var value = status.ToString();
            reports = reports.Where(r => r.Status == value);
        }

        return await reports
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.ReportId)
            .Select(ToDto())
            .ToPagedResultAsync(query.Page, query.PageSize, cancellationToken);
    }

    public async Task<ReportDto> GetAsync(
        long reportId,
        int? ownerUserId,
        CancellationToken cancellationToken = default)
    {
        return await Visible(ownerUserId)
            .Where(r => r.ReportId == reportId)
            .Select(ToDto())
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Report", reportId);
    }

    public async Task<ReportFile> OpenFileAsync(
        long reportId,
        int? ownerUserId,
        CancellationToken cancellationToken = default)
    {
        var report = await Visible(ownerUserId)
            .Where(r => r.ReportId == reportId)
            .Select(r => new { r.Status, r.FilePath, r.Server.ServerName, r.StartDate })
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Report", reportId);

        if (report.Status != nameof(ReportStatus.Completed) || report.FilePath is null)
        {
            throw new ConflictException(report.Status == nameof(ReportStatus.Failed)
                ? "This report failed and has no file."
                : "This report is not ready yet.");
        }

        var content = storage.OpenRead(report.FilePath)
            ?? throw new NotFoundException("Report file", reportId);

        var safeServerName = UnsafeFileNameCharacters().Replace(report.ServerName, "-");
        return new ReportFile(
            content,
            $"pulsemonitor-report-{reportId}-{safeServerName}-{report.StartDate:yyyyMMdd}.html",
            "text/html");
    }

    /// <summary>Reports the caller may see. Deleted servers are excluded explicitly: EF does not
    /// apply the Servers query filter through the Report.Server navigation.</summary>
    private IQueryable<Report> Visible(int? ownerUserId)
    {
        var reports = dbContext.Reports
            .AsNoTracking()
            .Where(r => r.Server.DeletedAt == null);

        return ownerUserId is { } userId
            ? reports.Where(r => r.RequestedByUserId == userId)
            : reports;
    }

    private Expression<Func<Report, ReportDto>> ToDto()
    {
        var retentionDays = options.Value.RetentionDays;

        return r => new ReportDto(
            r.ReportId,
            r.ServerId,
            r.Server.ServerName,
            r.RequestedByUserId,
            r.RequestedByUser.UserName,
            r.StartDate,
            r.EndDate,
            r.Status,
            r.ErrorMessage,
            r.CreatedAt,
            r.CompletedAt,
            r.CompletedAt == null ? null : r.CompletedAt.Value.AddDays(retentionDays));
    }

    [GeneratedRegex(@"[^A-Za-z0-9._-]")]
    private static partial Regex UnsafeFileNameCharacters();
}
