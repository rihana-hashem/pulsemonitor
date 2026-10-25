using FastEndpoints;
using RoleNames = PulseMonitor.Domain.Users.Roles;
using PulseMonitor.Application.Common.Models;
using PulseMonitor.Application.Servers;

namespace PulseMonitor.Api.Features.Servers.GetServers;

public sealed class GetServersEndpoint(
    IServerQueryService serverQueryService)
    : Endpoint<GetServersRequest, PagedResult<ServerDto>>
{
    public override void Configure()
    {
        Get("/servers");
        Version(1);
        Roles(RoleNames.Admin, RoleNames.User);

        Summary(s =>
        {
            s.Summary = "List servers";
            s.Description = "Returns a page of servers. Supports search by name or IP address, " +
                            "filtering by active state, and sorting by name, IP address or creation date. " +
                            "Deleted servers are never included.";
        });
    }

    public override async Task HandleAsync(
        GetServersRequest req,
        CancellationToken ct)
    {
        var servers = await serverQueryService.GetPageAsync(
            new ServerListQuery(
                req.Search,
                req.IsActive,
                req.SortBy,
                req.SortDirection,
                req.Page,
                req.PageSize),
            ct);

        await Send.OkAsync(servers, ct);
    }
}
