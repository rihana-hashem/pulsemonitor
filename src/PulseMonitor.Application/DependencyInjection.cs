using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Application.Monitoring;

namespace PulseMonitor.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AlertThresholdOptions>(
            configuration.GetSection(
                AlertThresholdOptions.SectionName));

        services.AddScoped<IMonitoringService, MonitoringService>();
        services.AddScoped<IAlertEvaluator, AlertEvaluator>();
        services.AddScoped<IServerMonitoringProcessor, ServerMonitoringProcessor>();

        return services;
    }
}