using FastEndpoints;
using PulseMonitor.Application.Metrics;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Features.Metrics.GetMetricsHistory;

public sealed class GetMetricsHistoryRequest
{
    /// <summary>Server id, from the route.</summary>
    public int Id { get; init; }

    /// <summary>Start of the range (inclusive), ISO 8601 with offset. Default: 24 hours before 'to'.</summary>
    public DateTimeOffset? From { get; init; }

    /// <summary>End of the range (exclusive), ISO 8601 with offset. Default: now.</summary>
    public DateTimeOffset? To { get; init; }
}

public sealed class GetMetricsHistoryEndpoint(
    IMetricsQueryService metricsQueryService,
    TimeProvider timeProvider)
    : Endpoint<GetMetricsHistoryRequest, MetricsHistoryDto>
{
    private static readonly TimeSpan DefaultRange = TimeSpan.FromHours(24);
    private static readonly TimeSpan MaxRange = TimeSpan.FromDays(31);

    public override void Configure()
    {
        Get("/servers/{id:int}/metrics");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Description(b => b.ProducesProblem(StatusCodes.Status404NotFound));
        Summary(s =>
        {
            s.Summary = "Metric history of a server";
            s.Description = "CPU, memory, disk and response-time metrics in a time range (at most 31 days), " +
                            "averaged into buckets so there are at most 360 points. Each point also has the " +
                            "bucket's maximum and sample count. Buckets without data are omitted.";
        });
    }

    public override async Task HandleAsync(GetMetricsHistoryRequest req, CancellationToken ct)
    {
        var to = (req.To ?? timeProvider.GetUtcNow()).UtcDateTime;
        var from = (req.From ?? req.To?.Subtract(DefaultRange) ?? timeProvider.GetUtcNow().Subtract(DefaultRange)).UtcDateTime;

        if (from >= to)
            AddError(r => r.From, "'from' must be earlier than 'to'.");
        else if (to - from > MaxRange)
            AddError(r => r.From, $"The range can be at most {MaxRange.TotalDays} days.");

        ThrowIfAnyErrors();

        var history = await metricsQueryService.GetHistoryAsync(
            new MetricsHistoryQuery(req.Id, from, to),
            ct);

        await Send.OkAsync(history, ct);
    }
}
