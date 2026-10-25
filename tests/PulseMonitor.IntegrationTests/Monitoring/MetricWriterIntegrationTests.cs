using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using PulseMonitor.Application.Monitoring;
using PulseMonitor.Infrastructure.Monitoring;
using PulseMonitor.Infrastructure.Persistence;

namespace PulseMonitor.IntegrationTests.Monitoring;

public sealed class MetricWriterIntegrationTests
{
    private const string ConnectionString =
        "Server=localhost;Database=PulseMonitorIntegrationTestsDb;" +
        "Trusted_Connection=True;TrustServerCertificate=True;";

    [Fact]
    public async Task SaveAsync_ShouldPersistServerAndDiskMetrics()
    {
        var connectionBuilder = new SqlConnectionStringBuilder(ConnectionString);

        if (!string.Equals(
                connectionBuilder.InitialCatalog,
                "PulseMonitorIntegrationTestsDb",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Integration tests must use the dedicated test database.");
        }

        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<PulseMonitorDbContext>()
            .UseSqlServer(connection)
            .Options;

        await using var dbContext = new PulseMonitorDbContext(options);

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync();

        var server = await dbContext.Servers
            .AsNoTracking()
            .Include(s => s.Disks)
            .FirstAsync(s => s.Disks.Any());

        var disk = server.Disks.First();

        // SQL Server datetime2(3) stores milliseconds.
        var collectedAt = DateTime.UtcNow;
        collectedAt = collectedAt.AddTicks(-(collectedAt.Ticks % 10_000));

        var snapshot = new ServerMetricSnapshot(
            ServerId: server.ServerId,
            CpuUsage: 45.50m,
            MemoryUsage: 68.25m,
            DiskUsage: 72.10m,
            ResponseTimeMs: 120,
            Status: "Online",
            CollectedAt: collectedAt,
            Disks:
            [
                new DiskMetricSnapshot(
                DiskId: disk.DiskId,
                TotalSpaceMB: 100_000,
                FreeSpaceMB: 27_900,
                UsedPercentage: 72.10m)
            ]);

        var writer = new MetricWriter(dbContext);

        await writer.SaveAsync(snapshot, CancellationToken.None);

        // A second DbContext shares the connection and transaction.
        await using var verificationContext =
            new PulseMonitorDbContext(options);

        await verificationContext.Database.UseTransactionAsync(
            transaction.GetDbTransaction());

        var savedMetric = await verificationContext.Metrics
            .AsNoTracking()
            .SingleAsync(m =>
                m.ServerId == snapshot.ServerId &&
                m.CollectedAt == snapshot.CollectedAt);

        var savedDiskMetric = await verificationContext.DiskMetrics
            .AsNoTracking()
            .SingleAsync(d =>
                d.DiskId == disk.DiskId &&
                d.CollectedAt == snapshot.CollectedAt);

        Assert.Equal(snapshot.CpuUsage, savedMetric.CpuUsage);
        Assert.Equal(snapshot.MemoryUsage, savedMetric.MemoryUsage);
        Assert.Equal(snapshot.DiskUsage, savedMetric.DiskUsage);
        Assert.Equal(snapshot.ResponseTimeMs, savedMetric.ResponseTimeMs);

        Assert.Equal(snapshot.Disks[0].TotalSpaceMB,
            savedDiskMetric.TotalSpaceMb);

        Assert.Equal(snapshot.Disks[0].FreeSpaceMB,
            savedDiskMetric.FreeSpaceMb);

        Assert.Equal(snapshot.Disks[0].UsedPercentage,
            savedDiskMetric.UsedPercentage);

        // No CommitAsync().
        // The transaction is rolled back when disposed.
    }
}