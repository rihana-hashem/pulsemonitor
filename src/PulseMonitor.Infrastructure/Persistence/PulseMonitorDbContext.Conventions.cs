using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace PulseMonitor.Infrastructure.Persistence;

// Kept out of the scaffolded file so re-scaffolding the database does not remove it.
public partial class PulseMonitorDbContext
{
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Every timestamp is stored in UTC (sysutcdatetime() defaults, TimeProvider UTC values),
        // but datetime2 has no time zone, so SQL Server returns DateTimeKind.Unspecified.
        // Marking values as UTC on read makes JSON include the "Z" suffix.
        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        configurationBuilder.Properties<DateTime?>().HaveConversion<UtcDateTimeConverter>();
    }

    private sealed class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
        value => value.Kind == DateTimeKind.Local ? value.ToUniversalTime() : value,
        value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
}
