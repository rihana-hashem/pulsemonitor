using FastEndpoints;
using FluentValidation;
using PulseMonitor.Application.Auth;

namespace PulseMonitor.Api.Features.Auth.Register;

public sealed class RegisterRequest
{
    public string UserName { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;
}

public sealed class RegisterValidator : Validator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.UserName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .Length(3, 100)
            .Matches("^[A-Za-z0-9._-]+$")
            .WithMessage("'{PropertyName}' may only contain letters, digits, dots, dashes and underscores.");

        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .MaximumLength(256)
            .EmailAddress();

        RuleFor(x => x.Password)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .Length(8, 128)
            .Must(p => p.Any(char.IsLetter) && p.Any(char.IsDigit))
            .WithMessage("'{PropertyName}' must contain at least one letter and one digit.");
    }
}

public sealed class RegisterEndpoint(IAuthService authService)
    : Endpoint<RegisterRequest, AuthResponse>
{
    public override void Configure()
    {
        Post("/auth/register");
        Version(1);
        AllowAnonymous();

        Description(b => b.ProducesProblem(StatusCodes.Status409Conflict));
        Summary(s =>
        {
            s.Summary = "Create an account";
            s.Description = "Registers a user with the User role and signs them in. " +
                            "The refresh token is set as an httpOnly cookie.";
            s.Responses[StatusCodes.Status409Conflict] = "The user name or email is already registered.";
        });
    }

    public override async Task HandleAsync(RegisterRequest req, CancellationToken ct)
    {
        var result = await authService.RegisterAsync(
            new RegisterCommand(req.UserName, req.Email, req.Password),
            ct);

        RefreshTokenCookie.Set(HttpContext.Response, result.RefreshToken, result.RefreshTokenExpiresAt);

        await Send.OkAsync(AuthResponse.From(result), ct);
    }
}
