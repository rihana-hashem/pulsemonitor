using FastEndpoints;
using FluentValidation;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Application.Common.Models;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Features.Alerts.GetAlerts;

/// <summary>All values come from the query string and are optional.</summary>
public sealed class GetAlertsRequest
{
    /// <summary>triggered (active) or resolved; omit for both.</summary>
    public AlertStatus? Status { get; init; }

    public int? ServerId { get; init; }

    public AlertMetricType? MetricType { get; init; }

    /// <summary>Triggered at or after this time (ISO 8601 with offset).</summary>
    public DateTimeOffset? From { get; init; }

    /// <summary>Triggered before this time (ISO 8601 with offset).</summary>
    public DateTimeOffset? To { get; init; }

    public AlertSortField SortBy { get; init; } = AlertSortField.TriggeredAt;

    public SortDirection SortDirection { get; init; } = SortDirection.Desc;

    /// <summary>1-based page number.</summary>
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 25;
}

public sealed class GetAlertsValidator : Validator<GetAlertsRequest>
{
    public GetAlertsValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.MetricType).IsInEnum();
        RuleFor(x => x.SortBy).IsInEnum();
        RuleFor(x => x.SortDirection).IsInEnum();
        RuleFor(x => x.ServerId).GreaterThan(0);
        RuleFor(x => x.From)
            .LessThan(x => x.To)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithMessage("'from' must be earlier than 'to'.");

        // The upper bound keeps (page - 1) * pageSize within int range for SQL OFFSET.
        RuleFor(x => x.Page).InclusiveBetween(1, 1_000_000);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetAlertsEndpoint(IAlertQueryService alertQueryService)
    : Endpoint<GetAlertsRequest, PagedResult<AlertListItemDto>>
{
    public override void Configure()
    {
        Get("/alerts");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Summary(s =>
        {
            s.Summary = "Alert history";
            s.Description = "Active and resolved alerts, newest first by default. Filter by status, server, " +
                            "metric and trigger time; sort by trigger time, server or metric. Alerts of deleted " +
                            "servers are not included. New and resolved alerts are also pushed live " +
                            "(AlertChanged on the monitoring hub).";
        });
    }

    public override async Task HandleAsync(GetAlertsRequest req, CancellationToken ct)
    {
        var page = await alertQueryService.GetPageAsync(
            new AlertListQuery(
                req.Status,
                req.ServerId,
                req.MetricType,
                req.From?.UtcDateTime,
                req.To?.UtcDateTime,
                req.SortBy,
                req.SortDirection,
                req.Page,
                req.PageSize),
            ct);

        await Send.OkAsync(page, ct);
    }
}
