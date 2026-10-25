using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

namespace PulseMonitor.Infrastructure.Auth;

internal static class RefreshTokenGenerator
{
    /// <summary>256 random bits, URL-safe so it fits in a cookie as-is.</summary>
    public static string NewToken() =>
        Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));

    /// <summary>
    /// SHA-256 as 64 hex characters; this is what dbo.RefreshTokens stores. A plain hash
    /// (no salt or slow KDF) is enough because the token is already 256 random bits.
    /// </summary>
    public static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
