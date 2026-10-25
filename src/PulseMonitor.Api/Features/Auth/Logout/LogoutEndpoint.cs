using FastEndpoints;
using PulseMonitor.Application.Auth;

namespace PulseMonitor.Api.Features.Auth.Logout;

public sealed class LogoutEndpoint(IAuthService authService) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/auth/logout");
        Version(1);
        // Identified by the refresh-token cookie; works even after the access token expired.
        AllowAnonymous();

        Description(b => b.Produces(StatusCodes.Status204NoContent));
        Summary(s =>
        {
            s.Summary = "Sign out";
            s.Description = "Revokes the current sign-in's refresh tokens and deletes the cookie. " +
                            "Always succeeds, so calling it twice is harmless.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var refreshToken = RefreshTokenCookie.Get(HttpContext.Request);

        if (refreshToken is not null)
            await authService.LogoutAsync(refreshToken, ct);

        RefreshTokenCookie.Clear(HttpContext.Response);
        await Send.NoContentAsync(ct);
    }
}
