using System.Net;
using System.Net.Sockets;
using FluentValidation;

namespace PulseMonitor.Api.Features.Servers;

/// <summary>Fields shared by the create and update server requests.</summary>
public interface IServerFields
{
    string ServerName { get; }
    string IpAddress { get; }
    string? Description { get; }
}

/// <summary>
/// Rules shared by the create and update validators. Lengths match the
/// dbo.Servers column sizes.
/// </summary>
public sealed class ServerFieldsValidator : AbstractValidator<IServerFields>
{
    public ServerFieldsValidator()
    {
        RuleFor(x => x.ServerName)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(x => x.IpAddress)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(45)
            .Must(BeValidIpAddress)
            .WithMessage("'{PropertyName}' must be a valid IPv4 or IPv6 address.");

        RuleFor(x => x.Description)
            .MaximumLength(500);
    }

    private static bool BeValidIpAddress(string ipAddress)
    {
        var value = ipAddress.Trim();

        if (!IPAddress.TryParse(value, out var address))
            return false;

        // IPAddress.TryParse also accepts shorthand IPv4 such as "10.1" or "010.0.0.1" (octal).
        // Only accept the canonical dotted-quad form for IPv4.
        return address.AddressFamily == AddressFamily.InterNetworkV6 ||
               address.ToString() == value;
    }
}
