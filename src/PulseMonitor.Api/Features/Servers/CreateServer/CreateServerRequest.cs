using FastEndpoints;

namespace PulseMonitor.Api.Features.Servers.CreateServer;

public sealed class CreateServerRequest : IServerFields
{
    /// <summary>Unique display name, e.g. "APP-SERVER-02".</summary>
    public string ServerName { get; init; } = string.Empty;

    /// <summary>IPv4 (dotted-quad) or IPv6 address.</summary>
    public string IpAddress { get; init; } = string.Empty;

    public string? Description { get; init; }
}

public sealed class CreateServerValidator : Validator<CreateServerRequest>
{
    public CreateServerValidator()
    {
        Include(new ServerFieldsValidator());
    }
}
