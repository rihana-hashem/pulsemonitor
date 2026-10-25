using FastEndpoints;
using RoleNames = PulseMonitor.Domain.Users.Roles;
using PulseMonitor.Application.Servers;

namespace PulseMonitor.Api.Features.Servers.GetServerById;

public sealed class GetServerByIdRequest
{
    public int Id { get; init; }
}

public sealed class GetServerByIdEndpoint(
    IServerQueryService serverQueryService)
    : Endpoint<GetServerByIdRequest, ServerDto>
{
    public override void Configure()
    {
        Get("/servers/{id:int}");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Description(b => b.ProducesProblem(StatusCodes.Status404NotFound));
        Summary(s =>
        {
            s.Summary = "Get a server";
            s.Description = "Returns a single server. Deleted servers return 404.";
        });
    }

    public override async Task HandleAsync(
        GetServerByIdRequest req,
        CancellationToken ct)
    {
        var server = await serverQueryService.GetByIdAsync(req.Id, ct);

        await Send.OkAsync(server, ct);
    }
}
