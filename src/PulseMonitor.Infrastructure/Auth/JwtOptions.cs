using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace PulseMonitor.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "PulseMonitor";

    public string Audience { get; set; } = "PulseMonitor";

    /// <summary>
    /// HMAC-SHA256 key, at least 32 bytes. Never commit it: use user-secrets in development
    /// and an environment variable (Jwt__SigningKey) or a secret store in production.
    /// </summary>
    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;

    public int RefreshTokenDays { get; set; } = 7;

    public SymmetricSecurityKey CreateSigningKey() => new(Encoding.UTF8.GetBytes(SigningKey));
}
