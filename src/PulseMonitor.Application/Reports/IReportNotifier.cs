namespace PulseMonitor.Application.Reports;

/// <summary>Tells the requesting user about report status changes (implemented with SignalR in the API).</summary>
public interface IReportNotifier
{
    Task ReportStatusChangedAsync(
        ReportDto report,
        CancellationToken cancellationToken);
}
