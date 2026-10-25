using Microsoft.EntityFrameworkCore;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Persistence.Models;

namespace PulseMonitor.Infrastructure.Alerts;

public sealed class AlertRepository(
    PulseMonitorDbContext dbContext) : IAlertRepository
{
    public async Task<IReadOnlyList<ActiveAlert>> GetActiveAlertsAsync(
        int serverId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Alerts
            .AsNoTracking()
            .Where(a => a.ServerId == serverId &&
                        a.Status == "Triggered")
            .Select(a => new ActiveAlert(
                a.AlertId,
                a.MetricType))
            .ToListAsync(cancellationToken);
    }

    public async Task ApplyChangesAsync(
        IReadOnlyList<AlertChange> changes,
        CancellationToken cancellationToken)
    {
        foreach (var change in changes)
        {
            if (change.ChangeType == AlertChangeType.Trigger)
            {
                dbContext.Alerts.Add(new Alert
                {
                    ServerId = change.ServerId,
                    MetricType = change.MetricType,
                    ThresholdValue = change.Threshold,
                    TriggerValue = change.ObservedValue,
                    LastObservedValue = change.ObservedValue,
                    TriggeredAt = change.ObservedAt,
                    LastObservedAt = change.ObservedAt,
                    Status = "Triggered"
                });

                continue;
            }

            if (change.AlertId is null)
                throw new InvalidOperationException(
                    "An existing alert ID is required.");

            var alert = await dbContext.Alerts
                .SingleAsync(
                    a => a.AlertId == change.AlertId.Value,
                    cancellationToken);

            alert.LastObservedValue = change.ObservedValue;
            alert.LastObservedAt = change.ObservedAt;

            if (change.ChangeType == AlertChangeType.Resolve)
            {
                alert.Status = "Resolved";
                alert.ResolvedAt = change.ObservedAt;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}