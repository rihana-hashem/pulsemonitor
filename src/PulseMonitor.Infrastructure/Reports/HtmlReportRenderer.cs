using System.Globalization;
using System.Net;
using System.Text;

namespace PulseMonitor.Infrastructure.Reports;

/// <summary>
/// Renders a report as a single self-contained HTML file (inline styles, no scripts) that opens
/// in any browser and prints cleanly. All values from the database are HTML-encoded.
/// </summary>
internal static class HtmlReportRenderer
{
    private static readonly CultureInfo Invariant = CultureInfo.InvariantCulture;

    public static string Render(ReportContent report)
    {
        var html = new StringBuilder();

        html.Append($$"""
            <!doctype html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Performance report - {{E(report.ServerName)}}</title>
            <style>
              body { font-family: system-ui, "Segoe UI", Roboto, sans-serif; color: #1f2328; margin: 32px auto; max-width: 960px; padding: 0 16px; line-height: 1.45; }
              h1 { margin: 0 0 4px; font-size: 26px; }
              h2 { margin: 32px 0 8px; font-size: 18px; border-bottom: 1px solid #d0d7de; padding-bottom: 4px; }
              .muted { color: #59636e; }
              table { width: 100%; border-collapse: collapse; font-size: 14px; }
              th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e6e8eb; }
              th { background: #f6f8fa; font-weight: 600; }
              td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
              .meta td { border: none; padding: 2px 16px 2px 0; }
              .over { color: #b42318; font-weight: 600; }
              @media print { body { margin: 0; } h2 { break-after: avoid; } tr { break-inside: avoid; } }
            </style>
            </head>
            <body>
            <h1>Performance report: {{E(report.ServerName)}}</h1>
            <p class="muted">PulseMonitor report #{{report.ReportId}}</p>
            <table class="meta">
              <tr><td class="muted">Server</td><td>{{E(report.ServerName)}} ({{E(report.IpAddress)}})</td></tr>
              <tr><td class="muted">Period</td><td>{{Time(report.From)}} to {{Time(report.To)}} (UTC)</td></tr>
              <tr><td class="muted">Requested by</td><td>{{E(report.RequestedBy)}}</td></tr>
              <tr><td class="muted">Generated</td><td>{{Time(report.GeneratedAt)}} UTC</td></tr>
              <tr><td class="muted">Readings</td><td>{{report.Samples.ToString("N0", Invariant)}} (one per minute while monitored)</td></tr>
            </table>
            """);

        // Summary
        html.Append("<h2>Summary</h2>");
        if (report.Summary.Count == 0)
        {
            html.Append("<p class=\"muted\">No metrics were collected in this period.</p>");
        }
        else
        {
            html.Append("""
                <table>
                <tr><th>Metric</th><th class="num">Average</th><th class="num">Minimum</th><th class="num">Maximum</th><th class="num">Threshold</th><th class="num">Readings over threshold</th></tr>
                """);
            foreach (var m in report.Summary)
            {
                var share = report.Samples == 0 ? 0 : m.ReadingsOverThreshold * 100.0 / report.Samples;
                var overClass = m.ReadingsOverThreshold > 0 ? " over" : "";
                html.Append($"""
                    <tr><td>{E(m.Name)}</td><td class="num">{N(m.Average)} {m.Unit}</td><td class="num">{N(m.Minimum)} {m.Unit}</td><td class="num">{N(m.Maximum)} {m.Unit}</td><td class="num">{N((double)m.Threshold)} {m.Unit}</td><td class="num{overClass}">{m.ReadingsOverThreshold.ToString("N0", Invariant)} ({N(share)}%)</td></tr>
                    """);
            }
            html.Append("</table>");
        }

        // Alerts
        var alerts = report.Alerts;
        html.Append($"<h2>Alerts ({alerts.TotalCount.ToString("N0", Invariant)})</h2>");
        if (alerts.TotalCount == 0)
        {
            html.Append("<p class=\"muted\">No alerts were triggered in this period.</p>");
        }
        else
        {
            if (alerts.TotalCount > alerts.Items.Count)
                html.Append($"<p class=\"muted\">Showing the first {alerts.Items.Count} of {alerts.TotalCount} alerts.</p>");

            html.Append("""
                <table>
                <tr><th>Triggered (UTC)</th><th>Metric</th><th class="num">Value</th><th class="num">Threshold</th><th>Resolved (UTC)</th></tr>
                """);
            foreach (var a in alerts.Items)
            {
                html.Append($"""
                    <tr><td>{Time(a.TriggeredAt)}</td><td>{E(a.MetricType)}</td><td class="num">{N((double)a.TriggerValue)}</td><td class="num">{N((double)a.Threshold)}</td><td>{(a.ResolvedAt is { } resolved ? Time(resolved) : "Still active")}</td></tr>
                    """);
            }
            html.Append("</table>");
        }

        // Over time
        var history = report.History;
        var bucket = history.BucketMinutes == 1 ? "minute" : $"{history.BucketMinutes} minutes";
        html.Append($"<h2>Over time</h2><p class=\"muted\">Average and peak per {bucket}. Periods without readings are omitted.</p>");
        if (history.Points.Count == 0)
        {
            html.Append("<p class=\"muted\">No metrics were collected in this period.</p>");
        }
        else
        {
            html.Append("""
                <table>
                <tr><th>From (UTC)</th><th class="num">CPU avg / peak</th><th class="num">Memory avg / peak</th><th class="num">Disk avg / peak</th><th class="num">Response time avg / peak</th><th class="num">Readings</th></tr>
                """);
            foreach (var p in history.Points)
            {
                html.Append($"""
                    <tr><td>{Time(p.Timestamp)}</td><td class="num">{N((double)p.CpuAvg)} / {N((double)p.CpuMax)} %</td><td class="num">{N((double)p.MemoryAvg)} / {N((double)p.MemoryMax)} %</td><td class="num">{N((double)p.DiskAvg)} / {N((double)p.DiskMax)} %</td><td class="num">{N(p.ResponseTimeAvg)} / {p.ResponseTimeMax} ms</td><td class="num">{p.Samples}</td></tr>
                    """);
            }
            html.Append("</table>");
        }

        html.Append("</body></html>");
        return html.ToString();
    }

    private static string E(string value) => WebUtility.HtmlEncode(value);

    private static string N(double value) => value.ToString("0.#", Invariant);

    private static string Time(DateTime value) => value.ToString("yyyy-MM-dd HH:mm", Invariant);
}
