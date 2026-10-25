using Microsoft.EntityFrameworkCore;
using PulseMonitor.Application.Alerts;
using PulseMonitor.Application.Common.Models;
using PulseMonitor.Infrastructure.Persistence;

namespace PulseMonitor.Infrastructure.Alerts;

public sealed class AlertQueryService(
    PulseMonitorDbContext dbContext) : IAlertQueryService
{
    public async Task<PagedResult<AlertListItemDto>> GetPageAsync(
        AlertListQuery query,
        CancellationToken cancellationToken = default)
    {
        // Explicit: EF does not apply the Servers soft-delete filter through the required
        // Alert.Server navigation, and a deleted server's history is not exposed through the API.
        var alerts = dbContext.Alerts
            .AsNoTracking()
            .Where(a => a.Server.DeletedAt == null);

        if (query.Status is { } status)
        {
            var value = status.ToString();
            alerts = alerts.Where(a => a.Status == value);
        }

        if (query.ServerId is { } serverId)
            alerts = alerts.Where(a => a.ServerId == serverId);

        if (query.MetricType is { } metricType)
        {
            var value = metricType.ToString();
            alerts = alerts.Where(a => a.MetricType == value);
        }

        if (query.From is { } from)
            alerts = alerts.Where(a => a.TriggeredAt >= from);

        if (query.To is { } to)
            alerts = alerts.Where(a => a.TriggeredAt < to);

        var ordered = query.SortBy switch
        {
            AlertSortField.ServerName => alerts.OrderByDirection(a => a.Server.ServerName, query.SortDirection),
            AlertSortField.MetricType => alerts.OrderByDirection(a => a.MetricType, query.SortDirection),
            _ => alerts.OrderByDirection(a => a.TriggeredAt, query.SortDirection)
        };

        return await ordered
            // Newest first among equal sort values, and a stable order across pages.
            .ThenByDescending(a => a.AlertId)
            .Select(a => new AlertListItemDto(
                a.AlertId,
                a.ServerId,
                a.Server.ServerName,
                a.MetricType,
                a.Status,
                a.ThresholdValue,
                a.TriggerValue,
                a.LastObservedValue,
                a.TriggeredAt,
                a.ResolvedAt))
            .ToPagedResultAsync(query.Page, query.PageSize, cancellationToken);
    }
}
