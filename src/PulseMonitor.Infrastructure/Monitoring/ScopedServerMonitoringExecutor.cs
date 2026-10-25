using Microsoft.Extensions.DependencyInjection;
using PulseMonitor.Application.Monitoring;

namespace PulseMonitor.Infrastructure.Monitoring;

public sealed class ScopedServerMonitoringExecutor(
    IServiceScopeFactory scopeFactory)
    : IServerMonitoringExecutor
{
    public async Task ExecuteAsync(
        ServerMonitoringTarget server,
        CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();

        var processor = scope.ServiceProvider
            .GetRequiredService<IServerMonitoringProcessor>();

        await processor.ProcessAsync(server, cancellationToken);
    }
}