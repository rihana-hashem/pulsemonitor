using FastEndpoints;
using FluentValidation;
using PulseMonitor.Application.Auth;

namespace PulseMonitor.Api.Features.Auth.Login;

public sealed class LoginRequest
{
    /// <summary>The user name or the email address.</summary>
    public string UserNameOrEmail { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;
}

public sealed class LoginValidator : Validator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.UserNameOrEmail).NotEmpty().MaximumLength(256);
        // Only presence and size here; strength rules apply at registration.
        RuleFor(x => x.Password).NotEmpty().MaximumLength(128);
    }
}

public sealed class LoginEndpoint(IAuthService authService)
    : Endpoint<LoginRequest, AuthResponse>
{
    public override void Configure()
    {
        Post("/auth/login");
        Version(1);
        AllowAnonymous();

        Description(b => b.ProducesProblem(StatusCodes.Status401Unauthorized));
        Summary(s =>
        {
            s.Summary = "Sign in";
            s.Description = "Returns a short-lived access token (send it as 'Authorization: Bearer ...') " +
                            "and sets the refresh token as an httpOnly cookie.";
            s.Responses[StatusCodes.Status401Unauthorized] = "Wrong user name/email or password, or the account is disabled.";
        });
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        var result = await authService.LoginAsync(
            new LoginCommand(req.UserNameOrEmail, req.Password),
            ct);

        RefreshTokenCookie.Set(HttpContext.Response, result.RefreshToken, result.RefreshTokenExpiresAt);

        await Send.OkAsync(AuthResponse.From(result), ct);
    }
}
