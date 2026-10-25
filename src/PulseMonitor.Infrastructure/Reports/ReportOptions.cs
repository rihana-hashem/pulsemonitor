namespace PulseMonitor.Infrastructure.Reports;

public sealed class ReportOptions
{
    public const string SectionName = "Reports";

    /// <summary>Folder for generated report files; relative paths are under the app's content root.</summary>
    public string StoragePath { get; set; } = "App_Data/reports";

    /// <summary>Completed reports are deleted this many days after they finish (a delayed Hangfire job).</summary>
    public int RetentionDays { get; set; } = 7;
}
