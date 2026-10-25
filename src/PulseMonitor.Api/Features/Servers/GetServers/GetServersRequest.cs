using FastEndpoints;
using FluentValidation;
using PulseMonitor.Application.Common.Models;
using PulseMonitor.Application.Servers;

namespace PulseMonitor.Api.Features.Servers.GetServers;

/// <summary>All values come from the query string and are optional.</summary>
public sealed class GetServersRequest
{
    /// <summary>Matches part of the server name or IP address.</summary>
    public string? Search { get; init; }

    /// <summary>true = only active, false = only inactive, omitted = both.</summary>
    public bool? IsActive { get; init; }

    public ServerSortField SortBy { get; init; } = ServerSortField.Name;

    public SortDirection SortDirection { get; init; } = SortDirection.Asc;

    /// <summary>1-based page number.</summary>
    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 20;
}

public sealed class GetServersValidator : Validator<GetServersRequest>
{
    public const int MaxPageSize = 100;

    public GetServersValidator()
    {
        RuleFor(x => x.Search).MaximumLength(150);
        RuleFor(x => x.SortBy).IsInEnum();
        RuleFor(x => x.SortDirection).IsInEnum();

        // The upper bound keeps (page - 1) * pageSize within int range for SQL OFFSET.
        RuleFor(x => x.Page).InclusiveBetween(1, 1_000_000);
        RuleFor(x => x.PageSize).InclusiveBetween(1, MaxPageSize);
    }
}
