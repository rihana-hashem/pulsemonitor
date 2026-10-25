namespace PulseMonitor.Domain.Exceptions;

/// <summary>Credentials or a token were rejected. Maps to HTTP 401.</summary>
public sealed class AuthenticationFailedException(string message)
    : Exception(message);
