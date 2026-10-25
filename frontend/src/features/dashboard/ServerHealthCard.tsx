import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Box from '@mui/material/Box'
import CardActionArea from '@mui/material/CardActionArea'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { formatDateTime } from '../../utils/format'
import { formatMetric, type MetricUnit } from '../metrics/formatters'
import { HealthChip } from './HealthChip'
import type { ServerHealth } from './serverHealth'
import type { AlertThresholds, ServerOverview } from './types'

type ServerHealthCardProps = {
  server: ServerOverview
  health: ServerHealth
  thresholds: AlertThresholds
}

/** One server at a glance; the whole card links to its details page. */
export function ServerHealthCard({ server, health, thresholds }: ServerHealthCardProps) {
  const reading = server.latestReading
  // Readings of a paused or stale server are kept visible but dimmed: they are not current.
  const current = health !== 'paused' && health !== 'stale'

  return (
    <Paper variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea
        component={RouterLink}
        to={`/servers/${server.serverId}`}
        sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
      >
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" component="h3" noWrap sx={{ fontWeight: 600 }}>
              {server.serverName}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              {server.ipAddress}
            </Typography>
          </Box>
          <HealthChip health={health} count={server.activeAlerts.length} />
        </Stack>

        {reading ? (
          <Stack spacing={1.25} sx={{ mt: 1.5, opacity: current ? 1 : 0.6 }}>
            <Meter label="CPU" value={reading.cpuUsage} threshold={thresholds.cpuUsage} />
            <Meter label="Memory" value={reading.memoryUsage} threshold={thresholds.memoryUsage} />
            <Meter label="Disk" value={reading.diskUsage} threshold={thresholds.diskUsage} />
            <ValueRow
              label="Response time"
              value={reading.responseTimeMs}
              unit="ms"
              overLimit={reading.responseTimeMs >= thresholds.responseTimeMs}
            />
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>
            No readings yet. The first one arrives within a minute of adding the server.
          </Typography>
        )}

        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 'auto', pt: 1.5 }}>
          {health === 'paused'
            ? 'Monitoring paused'
            : reading
              ? `Updated ${formatDateTime(reading.collectedAt)}`
              : 'Waiting for the first reading'}
        </Typography>
      </CardActionArea>
    </Paper>
  )
}

function ValueRow({ label, value, unit, overLimit }: { label: string; value: number; unit: MetricUnit; overLimit: boolean }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        {/* Over the alert threshold: an icon, not only a color. */}
        {overLimit && <WarningAmberIcon fontSize="inherit" color="error" titleAccess="Over the alert threshold" />}
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {formatMetric(value, unit)}
        </Typography>
      </Stack>
    </Stack>
  )
}

/** Percentage meter: accent fill on a same-ramp track; the fill turns to the error color over the threshold. */
function Meter({ label, value, threshold }: { label: string; value: number; threshold: number }) {
  const overLimit = value >= threshold

  return (
    <Box>
      <ValueRow label={label} value={value} unit="percent" overLimit={overLimit} />
      <LinearProgress
        variant="determinate"
        value={Math.min(value, 100)}
        aria-label={`${label} ${formatMetric(value, 'percent')}${overLimit ? ', over the alert threshold' : ''}`}
        sx={{
          mt: 0.5,
          height: 6,
          borderRadius: 1,
          bgcolor: 'chart.track',
          '& .MuiLinearProgress-bar': { bgcolor: overLimit ? 'error.main' : 'chart.series', borderRadius: 1 },
        }}
      />
    </Box>
  )
}
