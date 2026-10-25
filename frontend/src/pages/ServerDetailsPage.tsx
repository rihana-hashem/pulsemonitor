import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link as RouterLink, useParams, useSearchParams } from 'react-router'
import { peakOf, toSeries } from '../features/metrics/chartData'
import { DiskUsageList } from '../features/metrics/DiskUsageList'
import { formatMetric } from '../features/metrics/formatters'
import { MetricChart } from '../features/metrics/MetricChart'
import { MetricsTable } from '../features/metrics/MetricsTable'
import { useLatestMetrics, useMetricsHistory } from '../features/metrics/queries'
import { defaultRange, findRange, timeRanges, type TimeRange } from '../features/metrics/ranges'
import { StatTile } from '../features/metrics/StatTile'
import type { MetricPoint } from '../features/metrics/types'
import { useConnectionStatus } from '../features/realtime/connection'
import { LiveStatusChip } from '../features/realtime/LiveStatusChip'
import { useServerLiveUpdates } from '../features/realtime/useServerLiveUpdates'
import { useServer } from '../features/servers/queries'
import { formatDateTime, parseApiDate } from '../utils/format'
import NotFoundPage from './NotFoundPage'

type MetricDefinition = {
  title: string
  unit: 'percent' | 'ms'
  average: (point: MetricPoint) => number
  peak: (point: MetricPoint) => number
}

const metrics: MetricDefinition[] = [
  { title: 'CPU usage', unit: 'percent', average: (p) => p.cpuAvg, peak: (p) => p.cpuMax },
  { title: 'Memory usage', unit: 'percent', average: (p) => p.memoryAvg, peak: (p) => p.memoryMax },
  { title: 'Disk usage', unit: 'percent', average: (p) => p.diskAvg, peak: (p) => p.diskMax },
  { title: 'Response time', unit: 'ms', average: (p) => p.responseTimeAvg, peak: (p) => p.responseTimeMax },
]

export default function ServerDetailsPage() {
  const serverId = Number(useParams().serverId)

  if (!Number.isInteger(serverId) || serverId <= 0) return <NotFoundPage />
  return <ServerDetails serverId={serverId} />
}

function ServerDetails({ serverId }: { serverId: number }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = findRange(searchParams.get('range'))
  const [view, setView] = useState<'charts' | 'table'>('charts')

  // Pushed over SignalR while connected; polling is only the fallback.
  useServerLiveUpdates(serverId)
  const poll = useConnectionStatus() !== 'connected'

  const server = useServer(serverId)
  const latest = useLatestMetrics(serverId, { poll })
  const history = useMetricsHistory(serverId, range, { poll })

  const changeRange = (next: TimeRange) =>
    setSearchParams(next.key === defaultRange.key ? {} : { range: next.key }, { replace: true })

  if (server.error?.status === 404) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Server not found
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          It may have been deleted.
        </Typography>
        <Button component={RouterLink} to="/servers" variant="contained">
          Back to servers
        </Button>
      </Box>
    )
  }

  const points = history.data?.points ?? []
  const series = history.data ? toSeries(points, history.data.bucketMinutes) : null
  const snapshot = latest.data

  const peakCaption = (pick: (p: MetricPoint) => number, unit: 'percent' | 'ms') => {
    const peak = peakOf(points, pick)
    return peak === null ? `No data ${range.phrase}` : `Peak ${formatMetric(peak, unit)} ${range.phrase}`
  }

  return (
    <Box component="section">
      <Button component={RouterLink} to="/servers" startIcon={<ArrowBackIcon />} size="small" sx={{ mb: 1 }}>
        Servers
      </Button>

      {/* Header */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Typography variant="h4" component="h1">
          {server.data?.serverName ?? 'Server'}
        </Typography>
        {server.data && (
          <Chip
            size="small"
            label={server.data.isActive ? 'Monitored' : 'Paused'}
            color={server.data.isActive ? 'success' : 'default'}
            variant="outlined"
          />
        )}
      </Stack>
      {server.data && (
        <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
          <Box component="span" sx={{ fontFamily: 'monospace' }}>
            {server.data.ipAddress}
          </Box>
          {server.data.description ? ` · ${server.data.description}` : ''}
        </Typography>
      )}

      {/* Filters: one row above everything they scope. */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ my: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={range.key}
            onChange={(_, key: string | null) => key && changeRange(findRange(key))}
            aria-label="Time range"
          >
            {timeRanges.map((r) => (
              <ToggleButton key={r.key} value={r.key} aria-label={`Last ${r.label}`}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, next: 'charts' | 'table' | null) => next && setView(next)}
            aria-label="View"
          >
            <ToggleButton value="charts">Charts</ToggleButton>
            <ToggleButton value="table">Table</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <LiveStatusChip />
          {snapshot && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Last reading {formatDateTime(snapshot.collectedAt)}
            </Typography>
          )}
        </Stack>
      </Stack>

      {latest.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load the latest metrics: {latest.error.message}
        </Alert>
      )}

      {/* Current values */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, mb: 3 }}>
        <StatTile
          label="CPU"
          value={snapshot ? formatMetric(snapshot.cpuUsage, 'percent') : '–'}
          caption={peakCaption((p) => p.cpuMax, 'percent')}
        />
        <StatTile
          label="Memory"
          value={snapshot ? formatMetric(snapshot.memoryUsage, 'percent') : '–'}
          caption={peakCaption((p) => p.memoryMax, 'percent')}
        />
        <StatTile
          label="Disk"
          value={snapshot ? formatMetric(snapshot.diskUsage, 'percent') : '–'}
          caption={peakCaption((p) => p.diskMax, 'percent')}
        />
        <StatTile
          label="Response time"
          value={snapshot ? formatMetric(snapshot.responseTimeMs, 'ms') : '–'}
          caption={peakCaption((p) => p.responseTimeMax, 'ms')}
        />
      </Box>

      {/* History */}
      {history.error && !history.data ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => history.refetch()}>Retry</Button>}>
          Could not load the metric history: {history.error.message}
        </Alert>
      ) : !history.data || !series ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
          <CircularProgress aria-label="Loading metric history" />
        </Box>
      ) : view === 'table' ? (
        <MetricsTable points={points} />
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {metrics.map((metric) => (
            <MetricChart
              key={metric.title}
              title={metric.title}
              unit={metric.unit}
              series={series}
              average={metric.average}
              peak={metric.peak}
              from={parseApiDate(history.data.from)}
              to={parseApiDate(history.data.to)}
              rangeMinutes={range.minutes}
              bucketMinutes={history.data.bucketMinutes}
              refreshing={history.isFetching && history.isPlaceholderData}
            />
          ))}
        </Box>
      )}

      {snapshot && (
        <Box sx={{ mt: 3 }}>
          <DiskUsageList disks={snapshot.disks} />
        </Box>
      )}
    </Box>
  )
}
