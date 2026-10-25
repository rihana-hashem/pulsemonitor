import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { formatDateTime, parseApiDate } from '../../utils/format'
import { formatMetric } from '../metrics/formatters'
import { metricNames, metricUnit } from '../metrics/labels'
import type { ServerOverview } from './types'

/** Open alerts across all servers, newest first. */
export function ActiveAlertsList({ servers }: { servers: ServerOverview[] }) {
  const alerts = servers
    .flatMap((server) => server.activeAlerts.map((alert) => ({ server, alert })))
    .sort((a, b) => parseApiDate(b.alert.triggeredAt).getTime() - parseApiDate(a.alert.triggeredAt).getTime())

  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
        Active alerts
      </Typography>
      {alerts.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          No active alerts. Every monitored value is within its threshold.
        </Typography>
      ) : (
        <List dense disablePadding>
          {alerts.map(({ server, alert }) => {
            const unit = metricUnit(alert.metricType)
            const value = alert.lastObservedValue ?? alert.triggerValue
            return (
              <ListItem key={alert.alertId} disableGutters alignItems="flex-start">
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                  <WarningAmberIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <>
                      <Link component={RouterLink} to={`/servers/${server.serverId}`} underline="hover">
                        {server.serverName}
                      </Link>
                      {` · ${metricNames[alert.metricType] ?? alert.metricType}`}
                    </>
                  }
                  secondary={`${formatMetric(value, unit)} (threshold ${formatMetric(alert.threshold, unit)}) · since ${formatDateTime(alert.triggeredAt)}`}
                />
              </ListItem>
            )
          })}
        </List>
      )}
    </Paper>
  )
}
