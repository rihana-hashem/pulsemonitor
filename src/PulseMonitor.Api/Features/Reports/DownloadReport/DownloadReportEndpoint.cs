using FastEndpoints;
using PulseMonitor.Api.Auth;
using PulseMonitor.Application.Reports;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Features.Reports.DownloadReport;

public sealed class DownloadReportRequest
{
    public long Id { get; init; }
}

public sealed class DownloadReportEndpoint(IReportService reportService)
    : Endpoint<DownloadReportRequest>
{
    public override void Configure()
    {
        Get("/reports/{id:long}/download");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Description(b => b
            .Produces(StatusCodes.Status200OK, contentType: "text/html")
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict));
        Summary(s =>
        {
            s.Summary = "Download a completed report";
            s.Description = "The report as a self-contained HTML file. Requires the access token like every " +
                            "other endpoint, so there are no public links to report files.";
            s.Responses[StatusCodes.Status409Conflict] = "The report is not completed yet, or failed.";
        });
    }

    public override async Task HandleAsync(DownloadReportRequest req, CancellationToken ct)
    {
        var file = await reportService.OpenFileAsync(req.Id, User.OwnerFilter(), ct);

        await using (file.Content)
        {
            await Send.StreamAsync(file.Content, file.FileName, contentType: file.ContentType, cancellation: ct);
        }
    }
}
