namespace PulseMonitor.Application.Auth;

public interface IAuthService
{
    /// <summary>Creates an account with the User role and signs it in.</summary>
    /// <exception cref="Domain.Exceptions.ConflictException">The user name or email is already registered.</exception>
    Task<AuthResult> RegisterAsync(
        RegisterCommand command,
        CancellationToken cancellationToken = default);

    /// <exception cref="Domain.Exceptions.AuthenticationFailedException">
    /// Unknown user, wrong password or disabled account.
    /// </exception>
    Task<AuthResult> LoginAsync(
        LoginCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Exchanges a refresh token for a new access token and a new refresh token (rotation).
    /// Presenting an already-used token revokes every token from that sign-in.
    /// </summary>
    /// <exception cref="Domain.Exceptions.AuthenticationFailedException">
    /// Unknown, expired, revoked or reused token, or disabled account.
    /// </exception>
    Task<AuthResult> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);

    /// <summary>Ends the sign-in the refresh token belongs to. Unknown tokens are ignored.</summary>
    Task LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);
}
