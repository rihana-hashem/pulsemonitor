using FastEndpoints;
using RoleNames = PulseMonitor.Domain.Users.Roles;
using PulseMonitor.Application.Servers;

namespace PulseMonitor.Api.Features.Servers.DeleteServer;

public sealed class DeleteServerRequest
{
    public int Id { get; init; }
}

public sealed class DeleteServerEndpoint(
    IServerCommandService serverCommandService)
    : Endpoint<DeleteServerRequest>
{
    public override void Configure()
    {
        Delete("/servers/{id:int}");
        Version(1);
        Roles(RoleNames.Admin);

        Description(b => b
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound));
        Summary(s =>
        {
            s.Summary = "Delete a server";
            s.Description = "Soft delete: monitoring stops, the server disappears from the API and its open alerts " +
                            "are resolved. Metric, alert and report history is kept, and the name can be reused.";
        });
    }

    public override async Task HandleAsync(
        DeleteServerRequest req,
        CancellationToken ct)
    {
        await serverCommandService.DeleteAsync(req.Id, ct);

        await Send.NoContentAsync(ct);
    }
}
