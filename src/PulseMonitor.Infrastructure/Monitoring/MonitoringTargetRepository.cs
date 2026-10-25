using Microsoft.EntityFrameworkCore;
using PulseMonitor.Application.Monitoring;
using PulseMonitor.Infrastructure.Persistence;

namespace PulseMonitor.Infrastructure.Monitoring;

public sealed class MonitoringTargetRepository(
    PulseMonitorDbContext dbContext) : IMonitoringTargetRepository
{
    public async Task<IReadOnlyList<ServerMonitoringTarget>> GetActiveServersAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.Servers
            .AsNoTracking()
            .Where(server => server.IsActive)
            .Select(server => new ServerMonitoringTarget(
                server.ServerId,
                server.ServerName,
                server.IpAddress,
                server.Disks
                    .Where(disk => disk.IsActive)
                    .Select(disk => new DiskMonitoringTarget(
                        disk.DiskId,
                        disk.DriveLetter))
                    .ToList()))
            .ToListAsync(cancellationToken);
    }
}