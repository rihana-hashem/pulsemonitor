using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Application.Monitoring;
using PulseMonitor.Infrastructure.Alerts;
using PulseMonitor.Infrastructure.Persistence;

namespace PulseMonitor.IntegrationTests.Alerts;

public sealed class AlertEvaluatorIntegrationTests
{
    private const string ConnectionString =
        "Server=localhost;Database=PulseMonitorIntegrationTestsDb;" +
        "Trusted_Connection=True;TrustServerCertificate=True;";

    [Fact]
    public async Task EvaluateAsync_ShouldHandleCompleteAlertLifecycle()
    {
        var builder = new SqlConnectionStringBuilder(ConnectionString);

        if (!string.Equals(
                builder.InitialCatalog,
                "PulseMonitorIntegrationTestsDb",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Integration tests must use the dedicated test database.");
        }

        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync();

        var dbOptions = new DbContextOptionsBuilder<PulseMonitorDbContext>()
            .UseSqlServer(connection)
            .Options;

        await using var dbContext = new PulseMonitorDbContext(dbOptions);
        await using var transaction =
            await dbContext.Database.BeginTransactionAsync();

        var serverId = await dbContext.Servers
            .AsNoTracking()
            .Select(s => s.ServerId)
            .FirstAsync();

        var repository = new AlertRepository(dbContext);

        var thresholds = Options.Create(new AlertThresholdOptions
        {
            CpuUsage = 90,
            MemoryUsage = 100,
            DiskUsage = 100,
            ResponseTimeMs = 10_000
        });

        var evaluator = new AlertEvaluator(repository, thresholds);

        var start = DateTime.UtcNow;
        start = start.AddTicks(-(start.Ticks % 10_000));

        ServerMetricSnapshot CreateSnapshot(decimal cpu, int minutes)
            => new(
                ServerId: serverId,
                CpuUsage: cpu,
                MemoryUsage: 50,
                DiskUsage: 40,
                ResponseTimeMs: 100,
                Status: "Online",
                CollectedAt: start.AddMinutes(minutes),
                Disks: []);

        // 1. Trigger
        await evaluator.EvaluateAsync(
            CreateSnapshot(95, 0),
            CancellationToken.None);

        var firstAlert = await dbContext.Alerts
            .AsNoTracking()
            .SingleAsync(a =>
                a.ServerId == serverId &&
                a.MetricType == "CpuUsage" &&
                a.Status == "Triggered");

        Assert.Equal(95m, firstAlert.TriggerValue);
        Assert.Equal(95m, firstAlert.LastObservedValue);

        // 2. Observe: no duplicate alert
        await evaluator.EvaluateAsync(
            CreateSnapshot(97, 1),
            CancellationToken.None);

        var observedAlert = await dbContext.Alerts
            .AsNoTracking()
            .SingleAsync(a => a.AlertId == firstAlert.AlertId);

        Assert.Equal("Triggered", observedAlert.Status);
        Assert.Equal(95m, observedAlert.TriggerValue);
        Assert.Equal(97m, observedAlert.LastObservedValue);

        // 3. Resolve
        await evaluator.EvaluateAsync(
            CreateSnapshot(60, 2),
            CancellationToken.None);

        var resolvedAlert = await dbContext.Alerts
            .AsNoTracking()
            .SingleAsync(a => a.AlertId == firstAlert.AlertId);

        Assert.Equal("Resolved", resolvedAlert.Status);
        Assert.NotNull(resolvedAlert.ResolvedAt);

        // 4. Re-trigger
        await evaluator.EvaluateAsync(
            CreateSnapshot(96, 3),
            CancellationToken.None);

        var cpuAlerts = await dbContext.Alerts
            .AsNoTracking()
            .Where(a =>
                a.ServerId == serverId &&
                a.MetricType == "CpuUsage")
            .OrderBy(a => a.AlertId)
            .ToListAsync();

        Assert.Equal(2, cpuAlerts.Count);
        Assert.Equal("Resolved", cpuAlerts[0].Status);
        Assert.Equal("Triggered", cpuAlerts[1].Status);

        // Transaction rolls back automatically on disposal.
    }
}