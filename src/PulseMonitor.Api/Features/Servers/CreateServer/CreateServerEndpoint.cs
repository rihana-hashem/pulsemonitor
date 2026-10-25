using FastEndpoints;
using PulseMonitor.Api.Features.Servers.GetServerById;
using RoleNames = PulseMonitor.Domain.Users.Roles;
using PulseMonitor.Application.Servers;

namespace PulseMonitor.Api.Features.Servers.CreateServer;

public sealed class CreateServerEndpoint(
    IServerCommandService serverCommandService)
    : Endpoint<CreateServerRequest, ServerDto>
{
    public override void Configure()
    {
        Post("/servers");
        Version(1);
        Roles(RoleNames.Admin);

        // The endpoint answers 201 Created (Send.CreatedAtAsync), not the default 200.
        Description(b => b
            .ClearDefaultProduces(StatusCodes.Status200OK)
            .Produces<ServerDto>(StatusCodes.Status201Created, "application/json")
            .ProducesProblem(StatusCodes.Status409Conflict));
        Summary(s =>
        {
            s.Summary = "Create a server";
            s.Description = "Registers a server for monitoring. It is picked up by the next metrics collection run.";
            s.Responses[StatusCodes.Status201Created] = "The server was created; the Location header points to it.";
            s.Responses[StatusCodes.Status409Conflict] = "Another server already uses the name.";
        });
    }

    public override async Task HandleAsync(
        CreateServerRequest req,
        CancellationToken ct)
    {
        var server = await serverCommandService.CreateAsync(
            new CreateServerCommand(req.ServerName, req.IpAddress, req.Description),
            ct);

        await Send.CreatedAtAsync<GetServerByIdEndpoint>(
            new { id = server.ServerId },
            server,
            cancellation: ct);
    }
}
