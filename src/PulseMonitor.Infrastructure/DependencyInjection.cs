using System.Text;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Application.Auth;
using PulseMonitor.Application.Dashboard;
using PulseMonitor.Application.Metrics;
using PulseMonitor.Application.Monitoring;
using PulseMonitor.Application.Servers;
using PulseMonitor.Infrastructure.Alerts;
using PulseMonitor.Infrastructure.Auth;
using PulseMonitor.Infrastructure.HealthChecks;
using PulseMonitor.Infrastructure.Monitoring;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Persistence.Models;
using PulseMonitor.Infrastructure.Services;

namespace PulseMonitor.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("PulseMonitorDb")
            ?? throw new InvalidOperationException(
                "PulseMonitorDb connection string is missing.");

        services.AddDbContext<PulseMonitorDbContext>(options => options
            .UseSqlServer(connectionString)
            // Server has a soft-delete query filter, and Metric/Alert/Disk/Report require a
            // Server. EF warns that the filter interacts unpredictably with those required
            // navigations; in particular it is NOT applied when a query starts from Alerts or
            // Metrics and reads Server through the navigation. Such queries therefore exclude
            // deleted servers explicitly (a deleted server's history is not exposed through the
            // API), or start from the filtered Servers set.
            .ConfigureWarnings(warnings => warnings.Ignore(
                CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning)));

        services.AddHangfire(config => config
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
        {
            SchemaName = "HangFire",
            PrepareSchemaIfNecessary = true,
            QueuePollInterval = TimeSpan.FromSeconds(15)
        }));

        services.TryAddSingleton(TimeProvider.System);
        services.AddHealthChecks()
            .AddDbContextCheck<PulseMonitorDbContext>(
                "database",
                tags: [HealthCheckTags.Ready])
            // The API still serves requests without Hangfire, so report Degraded, not Unhealthy.
            .AddCheck<HangfireHealthCheck>(
                "hangfire",
                failureStatus: HealthStatus.Degraded,
                tags: [HealthCheckTags.Ready]);

        services.AddScoped<IServerQueryService, ServerQueryService>();
        services.AddScoped<IServerCommandService, ServerCommandService>();
        services.AddScoped<IMetricsQueryService, MetricsQueryService>();
        services.AddScoped<IDashboardQueryService, DashboardQueryService>();
        services.AddSingleton<IMetricCollector, SimulatedMetricCollector>();
        services.AddScoped<IMonitoringTargetRepository, MonitoringTargetRepository>();
        services.AddScoped<IMetricWriter, MetricWriter>();
        services.AddScoped<IAlertRepository, AlertRepository>();
        services.AddScoped<IAlertQueryService, AlertQueryService>();
        services.AddSingleton<IServerMonitoringExecutor,ScopedServerMonitoringExecutor>();

        services.AddAuth(configuration);

        return services;
    }

    private static void AddAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Checked at startup, so a missing key stops the app instead of failing the first login.
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(
                o => Encoding.UTF8.GetByteCount(o.SigningKey) >= 32,
                "Jwt:SigningKey must be at least 32 bytes. Set it with user-secrets in development " +
                "or the Jwt__SigningKey environment variable in production.")
            .Validate(o => o.AccessTokenMinutes is >= 1 and <= 60, "Jwt:AccessTokenMinutes must be 1-60.")
            .Validate(o => o.RefreshTokenDays is >= 1 and <= 90, "Jwt:RefreshTokenDays must be 1-90.")
            .ValidateOnStart();

        services.Configure<AdminBootstrapOptions>(
            configuration.GetSection(AdminBootstrapOptions.SectionName));

        services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
        services.AddSingleton<AccessTokenFactory>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddHostedService<AdminBootstrapper>();
    }
}