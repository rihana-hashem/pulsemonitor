using FastEndpoints;
using FluentValidation;
using PulseMonitor.Api.Auth;
using PulseMonitor.Application.Common.Models;
using PulseMonitor.Application.Reports;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Features.Reports.GetReports;

public sealed class GetReportsRequest
{
    public ReportStatus? Status { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 25;
}

public sealed class GetReportsValidator : Validator<GetReportsRequest>
{
    public GetReportsValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Page).InclusiveBetween(1, 1_000_000);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetReportsEndpoint(IReportService reportService)
    : Endpoint<GetReportsRequest, PagedResult<ReportDto>>
{
    public override void Configure()
    {
        Get("/reports");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Summary(s =>
        {
            s.Summary = "List reports";
            s.Description = "Newest first. Users see their own reports; admins see everyone's.";
        });
    }

    public override async Task HandleAsync(GetReportsRequest req, CancellationToken ct)
    {
        var page = await reportService.GetPageAsync(
            new ReportListQuery(User.OwnerFilter(), req.Status, req.Page, req.PageSize),
            ct);

        await Send.OkAsync(page, ct);
    }
}
