namespace PulseMonitor.Application.Auth;

public sealed record RegisterCommand(
    string UserName,
    string Email,
    string Password);

/// <param name="UserNameOrEmail">Either the user name or the email address.</param>
public sealed record LoginCommand(
    string UserNameOrEmail,
    string Password);

public sealed record AuthUserDto(
    int UserId,
    string UserName,
    string Email,
    IReadOnlyList<string> Roles);

/// <summary>
/// Result of a successful sign-in. The refresh token is for the API layer to put in an
/// httpOnly cookie; it must never be returned in a response body.
/// </summary>
public sealed record AuthResult(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    AuthUserDto User);
