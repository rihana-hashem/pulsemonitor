namespace PulseMonitor.Application.Alerts;

public interface IAlertRepository
{
    Task<IReadOnlyList<ActiveAlert>> GetActiveAlertsAsync(
        int serverId,
        CancellationToken cancellationToken);

    Task ApplyChangesAsync(
        IReadOnlyList<AlertChange> changes,
        CancellationToken cancellationToken);
}