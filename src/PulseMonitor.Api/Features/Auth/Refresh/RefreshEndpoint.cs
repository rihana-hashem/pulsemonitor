using FastEndpoints;
using PulseMonitor.Application.Auth;
using PulseMonitor.Domain.Exceptions;

namespace PulseMonitor.Api.Features.Auth.Refresh;

public sealed class RefreshEndpoint(IAuthService authService)
    : EndpointWithoutRequest<AuthResponse>
{
    public override void Configure()
    {
        Post("/auth/refresh");
        Version(1);
        // Authenticated by the refresh-token cookie, not by an access token (which may have expired).
        AllowAnonymous();

        Description(b => b.ProducesProblem(StatusCodes.Status401Unauthorized));
        Summary(s =>
        {
            s.Summary = "Refresh the access token";
            s.Description = "Uses the refresh-token cookie to issue a new access token and rotates the cookie. " +
                            "Reusing an old refresh token ends the whole sign-in.";
            s.Responses[StatusCodes.Status401Unauthorized] = "Missing, expired, revoked or reused refresh token. Sign in again.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var refreshToken = RefreshTokenCookie.Get(HttpContext.Request);

        try
        {
            if (refreshToken is null)
                throw new AuthenticationFailedException("You are not signed in.");

            var result = await authService.RefreshAsync(refreshToken, ct);

            RefreshTokenCookie.Set(HttpContext.Response, result.RefreshToken, result.RefreshTokenExpiresAt);
            await Send.OkAsync(AuthResponse.From(result), ct);
        }
        catch (AuthenticationFailedException ex)
        {
            // Handled here, not by GlobalExceptionHandler: the exception middleware clears response
            // headers, which would drop the Set-Cookie that removes the dead cookie.
            RefreshTokenCookie.Clear(HttpContext.Response);
            await Send.ResultAsync(TypedResults.Problem(
                title: "Authentication failed",
                detail: ex.Message,
                statusCode: StatusCodes.Status401Unauthorized));
        }
    }
}
