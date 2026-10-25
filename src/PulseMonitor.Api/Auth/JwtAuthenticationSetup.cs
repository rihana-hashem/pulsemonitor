using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PulseMonitor.Api.Hubs;
using PulseMonitor.Infrastructure.Auth;

namespace PulseMonitor.Api.Auth;

public static class JwtAuthenticationSetup
{
    /// <summary>
    /// Validates "Authorization: Bearer" access tokens with the same <see cref="JwtOptions"/>
    /// used to issue them (see AccessTokenFactory).
    /// </summary>
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

        // Configured from IOptions<JwtOptions> lazily, so the signing key is read after
        // configuration (including user-secrets) is loaded and validated at startup.
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>, IHostEnvironment>((bearer, jwtOptions, environment) =>
            {
                var jwt = jwtOptions.Value;

                // Keep claim names as issued ("sub", "name", "role") instead of mapping them
                // to long WS-* URIs.
                bearer.MapInboundClaims = false;

                // The WWW-Authenticate header explains why a token was rejected (expired, bad
                // issuer, ...): handy in development, a hint for attackers in production.
                bearer.IncludeErrorDetails = environment.IsDevelopment();

                // Browsers cannot set headers on WebSocket requests, so the SignalR client sends
                // the token as ?access_token=. Accept it on the hub path only; everywhere else the
                // Authorization header is required. (Request logging records the path, not the query.)
                bearer.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var token = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(token) &&
                            context.HttpContext.Request.Path.StartsWithSegments(MonitoringHub.Path))
                        {
                            context.Token = token;
                        }
                        return Task.CompletedTask;
                    }
                };

                bearer.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = jwt.CreateSigningKey(),
                    // Reject tokens signed with any other algorithm (e.g. "none").
                    ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
                    NameClaimType = "name",
                    RoleClaimType = "role",
                    // Default is 5 minutes, a third of the token's lifetime; allow only small clock drift.
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });

        services.AddAuthorization();

        return services;
    }
}
