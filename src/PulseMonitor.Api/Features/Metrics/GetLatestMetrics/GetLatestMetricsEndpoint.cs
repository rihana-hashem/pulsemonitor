using FastEndpoints;
using PulseMonitor.Application.Metrics;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Features.Metrics.GetLatestMetrics;

public sealed class GetLatestMetricsRequest
{
    /// <summary>Server id, from the route.</summary>
    public int Id { get; init; }
}

public sealed class GetLatestMetricsEndpoint(IMetricsQueryService metricsQueryService)
    : Endpoint<GetLatestMetricsRequest, LatestMetricsDto>
{
    public override void Configure()
    {
        Get("/servers/{id:int}/metrics/latest");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Description(b => b
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound));
        Summary(s =>
        {
            s.Summary = "Latest metrics of a server";
            s.Description = "The most recent CPU, memory, disk and response-time reading, plus the latest " +
                            "usage of each active disk.";
            s.Responses[StatusCodes.Status204NoContent] = "No metrics have been collected for the server yet.";
        });
    }

    public override async Task HandleAsync(GetLatestMetricsRequest req, CancellationToken ct)
    {
        var latest = await metricsQueryService.GetLatestAsync(req.Id, ct);

        if (latest is null)
            await Send.NoContentAsync(ct);
        else
            await Send.OkAsync(latest, ct);
    }
}
