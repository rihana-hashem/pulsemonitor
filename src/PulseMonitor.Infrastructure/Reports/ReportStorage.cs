using System.Text;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace PulseMonitor.Infrastructure.Reports;

/// <summary>Where report files live. Swappable for blob storage in a multi-instance deployment.</summary>
internal interface IReportStorage
{
    Task SaveAsync(string fileName, string content, CancellationToken cancellationToken);

    /// <returns>The file's content, or null when it no longer exists.</returns>
    Stream? OpenRead(string fileName);

    void Delete(string fileName);
}

/// <summary>Stores reports as files in a local folder (a Docker volume in production).</summary>
internal sealed class FileSystemReportStorage(
    IOptions<ReportOptions> options,
    IHostEnvironment environment) : IReportStorage
{
    private string Root => Path.GetFullPath(Path.Combine(environment.ContentRootPath, options.Value.StoragePath));

    public async Task SaveAsync(string fileName, string content, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Root);
        await File.WriteAllTextAsync(PathFor(fileName), content, Encoding.UTF8, cancellationToken);
    }

    public Stream? OpenRead(string fileName)
    {
        var path = PathFor(fileName);
        return File.Exists(path)
            ? new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true)
            : null;
    }

    public void Delete(string fileName)
    {
        var path = PathFor(fileName);
        if (File.Exists(path))
            File.Delete(path);
    }

    private string PathFor(string fileName)
    {
        // Names come from the database, but never let one escape the storage folder ("..\", "C:\...").
        if (fileName != Path.GetFileName(fileName) || fileName.Length == 0)
            throw new ArgumentException($"Invalid report file name '{fileName}'.", nameof(fileName));

        return Path.Combine(Root, fileName);
    }
}
