using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using PulseMonitor.Application.Auth;

namespace PulseMonitor.Infrastructure.Auth;

/// <summary>Creates short-lived JWT access tokens signed with HMAC-SHA256.</summary>
internal sealed class AccessTokenFactory(
    IOptions<JwtOptions> options,
    TimeProvider timeProvider)
{
    private readonly JsonWebTokenHandler _handler = new();

    public (string Token, DateTime ExpiresAt) Create(AuthUserDto user)
    {
        var jwt = options.Value;
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var expiresAt = now.AddMinutes(jwt.AccessTokenMinutes);

        var token = _handler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = jwt.Issuer,
            Audience = jwt.Audience,
            IssuedAt = now,
            NotBefore = now,
            Expires = expiresAt,
            // Short claim names ("sub", "name", "role"), as the API's token validation expects.
            Claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = user.UserId.ToString(),
                [JwtRegisteredClaimNames.Jti] = Guid.NewGuid().ToString(),
                ["name"] = user.UserName,
                [JwtRegisteredClaimNames.Email] = user.Email,
                ["role"] = user.Roles.ToArray()
            },
            SigningCredentials = new SigningCredentials(
                jwt.CreateSigningKey(),
                SecurityAlgorithms.HmacSha256)
        });

        return (token, expiresAt);
    }
}
