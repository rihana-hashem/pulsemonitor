using System.Security.Claims;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    /// <summary>The signed-in user's id, from the JWT "sub" claim.</summary>
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("The access token has no 'sub' claim."));

    public static bool IsAdmin(this ClaimsPrincipal user) => user.IsInRole(RoleNames.Admin);

    /// <summary>Admins see everyone's data; other users only their own.</summary>
    public static int? OwnerFilter(this ClaimsPrincipal user) => user.IsAdmin() ? null : user.GetUserId();
}
