using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Hubs;

/// <summary>
/// Real-time monitoring events. Clients join groups for what they display:
/// <list type="bullet">
/// <item><see cref="WatchDashboard"/>: compact readings of every server.</item>
/// <item><see cref="WatchServer"/>: full readings (including disks) of one server.</item>
/// </list>
/// Alert changes and presence go to every connected client.
/// </summary>
[Authorize(Roles = $"{RoleNames.Admin},{RoleNames.User}")]
public sealed class MonitoringHub(PresenceTracker presence) : Hub<IMonitoringClient>
{
    public const string Path = "/hubs/monitoring";

    public const string DashboardGroup = "dashboard";

    public static string ServerGroup(int serverId) => $"server:{serverId}";

    public override async Task OnConnectedAsync()
    {
        if (CurrentUser() is { } user && presence.Connect(user.UserId, user.UserName, Context.ConnectionId))
            await Clients.All.PresenceChanged(presence.GetOnlineUsers());

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Group memberships are removed automatically when a connection closes.
        if (CurrentUser() is { } user && presence.Disconnect(user.UserId, Context.ConnectionId))
            await Clients.All.PresenceChanged(presence.GetOnlineUsers());

        await base.OnDisconnectedAsync(exception);
    }

    public Task WatchDashboard() =>
        Groups.AddToGroupAsync(Context.ConnectionId, DashboardGroup);

    public Task UnwatchDashboard() =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, DashboardGroup);

    public Task WatchServer(int serverId)
    {
        if (serverId <= 0)
            throw new HubException("Invalid server id.");

        // Every signed-in user may read every server, so no per-server check is needed.
        return Groups.AddToGroupAsync(Context.ConnectionId, ServerGroup(serverId));
    }

    public Task UnwatchServer(int serverId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, ServerGroup(serverId));

    /// <summary>The users online right now; clients call this once after connecting.</summary>
    public IReadOnlyList<OnlineUser> GetOnlineUsers() => presence.GetOnlineUsers();

    private OnlineUser? CurrentUser() =>
        int.TryParse(Context.UserIdentifier, out var userId)
            ? new OnlineUser(userId, Context.User?.Identity?.Name ?? $"user {userId}")
            : null;
}
