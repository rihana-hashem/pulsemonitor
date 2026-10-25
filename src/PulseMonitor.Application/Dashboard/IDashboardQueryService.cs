namespace PulseMonitor.Application.Dashboard;

public interface IDashboardQueryService
{
    /// <summary>All servers (deleted ones excluded) with their latest reading and active alerts.</summary>
    Task<DashboardDto> GetAsync(CancellationToken cancellationToken = default);
}
