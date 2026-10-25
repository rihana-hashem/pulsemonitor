using PulseMonitor.Application.Auth;

namespace PulseMonitor.Api.Features.Auth;

/// <summary>
/// Returned after sign-in. The refresh token is not included: it is set as an httpOnly
/// cookie (see <see cref="RefreshTokenCookie"/>).
/// </summary>
public sealed record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    AuthUserDto User)
{
    public static AuthResponse From(AuthResult result) =>
        new(result.AccessToken, result.AccessTokenExpiresAt, result.User);
}
