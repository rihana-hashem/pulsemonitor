using PulseMonitor.Application.Common.Models;

namespace PulseMonitor.Application.Reports;

public interface IReportService
{
    /// <summary>
    /// Saves a Pending report and queues its generation in the background. Returns at once;
    /// status changes are pushed to the requester as the report is processed.
    /// </summary>
    /// <exception cref="Domain.Exceptions.NotFoundException">The server does not exist or was deleted.</exception>
    Task<ReportDto> RequestAsync(
        RequestReportCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>Newest first. Reports of deleted servers are not included.</summary>
    Task<PagedResult<ReportDto>> GetPageAsync(
        ReportListQuery query,
        CancellationToken cancellationToken = default);

    /// <param name="ownerUserId">Restrict to this user's reports; null for any user (admins).</param>
    /// <exception cref="Domain.Exceptions.NotFoundException">No such report (or not this user's).</exception>
    Task<ReportDto> GetAsync(
        long reportId,
        int? ownerUserId,
        CancellationToken cancellationToken = default);

    /// <exception cref="Domain.Exceptions.NotFoundException">No such report (or not this user's).</exception>
    /// <exception cref="Domain.Exceptions.ConflictException">The report is not completed yet, or failed.</exception>
    Task<ReportFile> OpenFileAsync(
        long reportId,
        int? ownerUserId,
        CancellationToken cancellationToken = default);
}
