using FastEndpoints;
using RoleNames = PulseMonitor.Domain.Users.Roles;
using PulseMonitor.Application.Servers;

namespace PulseMonitor.Api.Features.Servers.UpdateServer;

public sealed class UpdateServerEndpoint(
    IServerCommandService serverCommandService)
    : Endpoint<UpdateServerRequest, ServerDto>
{
    public override void Configure()
    {
        Put("/servers/{id:int}");
        Version(1);
        Roles(RoleNames.Admin);

        Description(b => b
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict));
        Summary(s =>
        {
            s.Summary = "Update a server";
            s.Description = "Replaces the server's name, IP address, description and active flag. " +
                            "Setting isActive to false pauses monitoring without deleting the server.";
            s.Responses[StatusCodes.Status409Conflict] = "Another server already uses the name.";
        });
    }

    public override async Task HandleAsync(
        UpdateServerRequest req,
        CancellationToken ct)
    {
        var server = await serverCommandService.UpdateAsync(
            new UpdateServerCommand(
                req.Id,
                req.ServerName,
                req.IpAddress,
                req.Description,
                req.IsActive!.Value), // Guaranteed by UpdateServerValidator.
            ct);

        await Send.OkAsync(server, ct);
    }
}
