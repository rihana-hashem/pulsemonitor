namespace PulseMonitor.Application.Reports;

/// <summary>Report lifecycle; matches dbo.Reports.Status.</summary>
public enum ReportStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}

/// <param name="From">Start of the reported period (UTC, inclusive).</param>
/// <param name="To">End of the reported period (UTC, exclusive).</param>
public sealed record RequestReportCommand(
    int ServerId,
    DateTime From,
    DateTime To,
    int RequestedByUserId);

/// <param name="ExpiresAt">When a completed report is deleted (see the retention setting).</param>
public sealed record ReportDto(
    long ReportId,
    int ServerId,
    string ServerName,
    int RequestedByUserId,
    string RequestedBy,
    DateTime From,
    DateTime To,
    string Status,
    string? ErrorMessage,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    DateTime? ExpiresAt);

/// <param name="OwnerUserId">Only this user's reports; null for all users (admins).</param>
public sealed record ReportListQuery(
    int? OwnerUserId,
    ReportStatus? Status,
    int Page,
    int PageSize);

public sealed record ReportFile(
    Stream Content,
    string FileName,
    string ContentType);
