namespace PulseMonitor.Infrastructure.Auth;

/// <summary>
/// First administrator, created at startup when no Admin exists yet. Set the password with
/// user-secrets in development (AdminBootstrap:Password) or an environment variable
/// (AdminBootstrap__Password); never commit it. Change it after first sign-in.
/// </summary>
public sealed class AdminBootstrapOptions
{
    public const string SectionName = "AdminBootstrap";

    public string UserName { get; set; } = "admin";

    public string Email { get; set; } = "admin@pulsemonitor.local";

    public string? Password { get; set; }
}
