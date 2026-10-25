using Microsoft.AspNetCore.SignalR;
using PulseMonitor.Application.Reports;

namespace PulseMonitor.Api.Hubs;

/// <summary>Pushes report status changes to the requesting user's connections (all their tabs).</summary>
public sealed class SignalRReportNotifier(
    IHubContext<MonitoringHub, IMonitoringClient> hub) : IReportNotifier
{
    public Task ReportStatusChangedAsync(ReportDto report, CancellationToken cancellationToken) =>
        // User ids come from the token's "sub" claim (SubjectUserIdProvider).
        hub.Clients.User(report.RequestedByUserId.ToString()).ReportStatusChanged(report);
}
