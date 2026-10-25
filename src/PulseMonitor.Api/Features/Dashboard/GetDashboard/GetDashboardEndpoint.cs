using FastEndpoints;
using PulseMonitor.Application.Dashboard;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Features.Dashboard.GetDashboard;

public sealed class GetDashboardEndpoint(IDashboardQueryService dashboardQueryService)
    : EndpointWithoutRequest<DashboardDto>
{
    public override void Configure()
    {
        Get("/dashboard");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Summary(s =>
        {
            s.Summary = "Dashboard overview";
            s.Description = "Every server (deleted ones excluded) with its latest reading and active alerts, " +
                            "plus the alert thresholds. Live changes are pushed over the monitoring hub " +
                            "(DashboardMetricsUpdated, AlertChanged).";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        await Send.OkAsync(await dashboardQueryService.GetAsync(ct), ct);
    }
}
