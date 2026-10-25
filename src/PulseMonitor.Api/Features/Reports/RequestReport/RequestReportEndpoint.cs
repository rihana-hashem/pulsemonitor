using FastEndpoints;
using FluentValidation;
using PulseMonitor.Api.Auth;
using PulseMonitor.Application.Reports;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Features.Reports.RequestReport;

public sealed class RequestReportRequest
{
    public int ServerId { get; init; }

    /// <summary>Start of the period (ISO 8601 with offset).</summary>
    public DateTimeOffset From { get; init; }

    /// <summary>End of the period (ISO 8601 with offset).</summary>
    public DateTimeOffset To { get; init; }
}

public sealed class RequestReportValidator : Validator<RequestReportRequest>
{
    public static readonly TimeSpan MaxRange = TimeSpan.FromDays(31);

    public RequestReportValidator()
    {
        RuleFor(x => x.ServerId).GreaterThan(0);
        RuleFor(x => x.From).NotEmpty();
        RuleFor(x => x.To).NotEmpty();
        RuleFor(x => x.From)
            .LessThan(x => x.To)
            .WithMessage("'from' must be earlier than 'to'.");
        RuleFor(x => x)
            .Must(x => x.To - x.From <= MaxRange)
            .WithName("to")
            .WithMessage($"A report can cover at most {MaxRange.TotalDays} days.");
    }
}

public sealed class RequestReportEndpoint(IReportService reportService)
    : Endpoint<RequestReportRequest, ReportDto>
{
    public override void Configure()
    {
        Post("/reports");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Description(b => b
            .ClearDefaultProduces(StatusCodes.Status200OK)
            .Produces<ReportDto>(StatusCodes.Status202Accepted, "application/json")
            .ProducesProblem(StatusCodes.Status404NotFound));
        Summary(s =>
        {
            s.Summary = "Request a performance report";
            s.Description = "Queues report generation for a server and period (at most 31 days) and returns " +
                            "at once with status Pending. Progress is pushed over the monitoring hub " +
                            "(ReportStatusChanged); when the report completes, a notification email is sent.";
            s.Responses[StatusCodes.Status202Accepted] = "Accepted; the Location header points to the report.";
        });
    }

    public override async Task HandleAsync(RequestReportRequest req, CancellationToken ct)
    {
        var report = await reportService.RequestAsync(
            new RequestReportCommand(req.ServerId, req.From.UtcDateTime, req.To.UtcDateTime, User.GetUserId()),
            ct);

        // 202: the work happens later, in a background job.
        await Send.ResultAsync(TypedResults.Accepted($"/api/v1/reports/{report.ReportId}", report));
    }
}
