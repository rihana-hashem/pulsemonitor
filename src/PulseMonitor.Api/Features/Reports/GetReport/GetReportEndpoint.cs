using FastEndpoints;
using PulseMonitor.Api.Auth;
using PulseMonitor.Application.Reports;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Features.Reports.GetReport;

public sealed class GetReportRequest
{
    public long Id { get; init; }
}

public sealed class GetReportEndpoint(IReportService reportService)
    : Endpoint<GetReportRequest, ReportDto>
{
    public override void Configure()
    {
        Get("/reports/{id:long}");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Description(b => b.ProducesProblem(StatusCodes.Status404NotFound));
        Summary(s =>
        {
            s.Summary = "Get a report's status";
            s.Description = "Users can only see their own reports (others return 404); admins see all.";
        });
    }

    public override async Task HandleAsync(GetReportRequest req, CancellationToken ct)
    {
        await Send.OkAsync(await reportService.GetAsync(req.Id, User.OwnerFilter(), ct), ct);
    }
}
