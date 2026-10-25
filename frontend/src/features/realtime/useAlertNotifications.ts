import { useEffect } from 'react'
import { useNotify } from '../../components/notifications/notificationContext'
import { formatMetric } from '../metrics/formatters'
import { metricNames, metricUnit } from '../metrics/labels'
import { onHubEvent } from './connection'
import type { AlertNotification } from './types'

function describe(alert: AlertNotification): string {
  const unit = metricUnit(alert.metricType)
  const metric = metricNames[alert.metricType] ?? alert.metricType
  const value = formatMetric(alert.value, unit)

  return alert.status === 'Triggered'
    ? `${alert.serverName}: ${metric} is ${value} (threshold ${formatMetric(alert.threshold, unit)})`
    : `${alert.serverName}: ${metric} is back to normal (${value})`
}

/** Shows a notification whenever an alert is triggered or resolved. Mount once, in the app shell. */
export function useAlertNotifications() {
  const notify = useNotify()

  useEffect(
    // MUI's Alert pairs the severity color with an icon, so the state is never color alone.
    () => onHubEvent('AlertChanged', (alert) => notify(describe(alert), alert.status === 'Triggered' ? 'warning' : 'success')),
    [notify],
  )
}
