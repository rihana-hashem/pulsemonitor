namespace PulseMonitor.Domain.Users;

/// <summary>Role names; they match dbo.Roles.RoleName.</summary>
public static class Roles
{
    /// <summary>Manages servers, users and monitoring settings.</summary>
    public const string Admin = "Admin";

    /// <summary>Views servers, metrics, alerts and reports.</summary>
    public const string User = "User";
}
