namespace PulseMonitor.Api.Hubs;

/// <summary>
/// Who is connected right now. A user with several tabs has several connections and counts
/// as online until the last one closes.
/// </summary>
/// <remarks>
/// In-memory, so it covers a single API instance. Running several instances needs a shared
/// store (e.g. Redis) together with a SignalR backplane.
/// </remarks>
public sealed class PresenceTracker
{
    private readonly Lock _lock = new();
    private readonly Dictionary<int, (string UserName, HashSet<string> Connections)> _users = [];

    /// <returns>True when this is the user's first connection (they just came online).</returns>
    public bool Connect(int userId, string userName, string connectionId)
    {
        lock (_lock)
        {
            if (_users.TryGetValue(userId, out var entry))
                return entry.Connections.Add(connectionId) && entry.Connections.Count == 1;

            _users[userId] = (userName, [connectionId]);
            return true;
        }
    }

    /// <returns>True when this was the user's last connection (they just went offline).</returns>
    public bool Disconnect(int userId, string connectionId)
    {
        lock (_lock)
        {
            if (!_users.TryGetValue(userId, out var entry) || !entry.Connections.Remove(connectionId))
                return false;

            if (entry.Connections.Count > 0)
                return false;

            _users.Remove(userId);
            return true;
        }
    }

    public IReadOnlyList<OnlineUser> GetOnlineUsers()
    {
        lock (_lock)
        {
            return _users
                .Select(pair => new OnlineUser(pair.Key, pair.Value.UserName))
                .OrderBy(user => user.UserName, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
