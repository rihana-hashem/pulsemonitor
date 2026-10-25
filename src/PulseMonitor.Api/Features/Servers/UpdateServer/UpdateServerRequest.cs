using FastEndpoints;
using FluentValidation;

namespace PulseMonitor.Api.Features.Servers.UpdateServer;

public sealed class UpdateServerRequest : IServerFields
{
    /// <summary>Bound from the route.</summary>
    public int Id { get; init; }

    public string ServerName { get; init; } = string.Empty;

    public string IpAddress { get; init; } = string.Empty;

    public string? Description { get; init; }

    /// <summary>Whether the server is monitored. Required: PUT replaces the whole resource.</summary>
    public bool? IsActive { get; init; }
}

public sealed class UpdateServerValidator : Validator<UpdateServerRequest>
{
    public UpdateServerValidator()
    {
        Include(new ServerFieldsValidator());

        RuleFor(x => x.IsActive).NotNull();
    }
}
