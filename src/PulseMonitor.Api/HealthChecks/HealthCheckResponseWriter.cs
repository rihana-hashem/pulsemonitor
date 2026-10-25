using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace PulseMonitor.Api.HealthChecks;

public static class HealthCheckResponseWriter
{
    // Exception details are deliberately left out of the response; the health check
    // service already logs them.
    public static Task WriteAsync(HttpContext context, HealthReport report)
    {
        var response = new
        {
            status = report.Status.ToString(),
            totalDurationMs = Math.Round(report.TotalDuration.TotalMilliseconds, 2),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                durationMs = Math.Round(entry.Value.Duration.TotalMilliseconds, 2)
            })
        };

        return context.Response.WriteAsJsonAsync(response);
    }
}
