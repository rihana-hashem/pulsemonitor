namespace PulseMonitor.Api.Features.Auth;

/// <summary>
/// The refresh token lives only in this cookie: httpOnly so scripts (and XSS) cannot read it,
/// Secure, SameSite=Strict so other sites cannot send it, and scoped to the auth endpoints.
/// </summary>
public static class RefreshTokenCookie
{
    public const string Name = "pm_refresh_token";

    private const string Path = "/api/v1/auth";

    public static string? Get(HttpRequest request) =>
        request.Cookies.TryGetValue(Name, out var token) && !string.IsNullOrWhiteSpace(token)
            ? token
            : null;

    public static void Set(HttpResponse response, string token, DateTime expiresAt)
    {
        var options = CreateOptions();
        options.Expires = expiresAt;
        response.Cookies.Append(Name, token, options);
    }

    public static void Clear(HttpResponse response) =>
        // Must use the same path (and flags) as Set, or the browser keeps the cookie.
        response.Cookies.Delete(Name, CreateOptions());

    private static CookieOptions CreateOptions() => new()
    {
        HttpOnly = true,
        // Browsers accept Secure cookies on http://localhost, so this also works in development.
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Path = Path,
        IsEssential = true
    };
}
