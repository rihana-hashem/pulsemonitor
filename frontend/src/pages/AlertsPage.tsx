import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'
import { AlertsTable } from '../features/alerts/AlertsTable'
import { useAlerts } from '../features/alerts/queries'
import type { AlertPeriod, AlertSortField, AlertStatusFilter } from '../features/alerts/types'
import { metricTypes, useAlertListParams } from '../features/alerts/useAlertListParams'
import { useAlertsLiveUpdates } from '../features/alerts/useAlertsLiveUpdates'
import { metricNames } from '../features/metrics/labels'
import { useConnectionStatus } from '../features/realtime/connection'
import { LiveStatusChip } from '../features/realtime/LiveStatusChip'
import type { AlertMetricType } from '../features/realtime/types'
import { useServers } from '../features/servers/queries'
import { useNow } from '../hooks/useNow'

const periods: { value: AlertPeriod; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'All' },
]

// The server filter lists at most this many servers (the API's page-size limit).
const serverOptionsLimit = 100

export default function AlertsPage() {
  useAlertsLiveUpdates()
  const poll = useConnectionStatus() !== 'connected'
  const [params, updateParams] = useAlertListParams()
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useAlerts(params, { poll })
  const servers = useServers({ sortBy: 'name', sortDirection: 'asc', page: 1, pageSize: serverOptionsLimit })
  // Keeps "Open for ..." current between refetches.
  const now = useNow(30_000)

  // A filter can leave the current page beyond the last one; step back to the new last page.
  useEffect(() => {
    if (data && data.items.length === 0 && params.page > 1 && data.totalPages > 0) {
      updateParams({ page: data.totalPages })
    }
  }, [data, params.page, updateParams])

  const changeSort = (field: AlertSortField) => {
    const sameField = params.sortBy === field
    updateParams({
      sortBy: field,
      // Time starts newest-first; text columns start A-Z.
      sortDirection: sameField ? (params.sortDirection === 'asc' ? 'desc' : 'asc') : field === 'triggeredAt' ? 'desc' : 'asc',
      page: 1,
    })
  }

  const filtered =
    params.status !== 'all' || params.serverId !== undefined || params.metricType !== undefined || params.period !== 'all'

  return (
    <Box component="section">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', rowGap: 1 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Alerts
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Active alerts and their history. New and resolved alerts appear automatically.
          </Typography>
        </Box>
        <LiveStatusChip />
      </Stack>

      <Paper variant="outlined">
        {/* Filters: one row above the table they scope. */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2, alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={params.status}
            onChange={(_, value: AlertStatusFilter | null) => value && updateParams({ status: value, page: 1 })}
            aria-label="Status"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="resolved">Resolved</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={params.period}
            onChange={(_, value: AlertPeriod | null) => value && updateParams({ period: value, page: 1 })}
            aria-label="Triggered within"
          >
            {periods.map((p) => (
              <ToggleButton key={p.value} value={p.value} aria-label={p.value === 'all' ? 'Any time' : `Last ${p.label}`}>
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <TextField
            select
            size="small"
            label="Server"
            value={params.serverId ?? ''}
            onChange={(e) => updateParams({ serverId: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All servers</MenuItem>
            {servers.data?.items.map((server) => (
              <MenuItem key={server.serverId} value={server.serverId}>
                {server.serverName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Metric"
            value={params.metricType ?? ''}
            onChange={(e) => updateParams({ metricType: (e.target.value || undefined) as AlertMetricType | undefined, page: 1 })}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All metrics</MenuItem>
            {metricTypes.map((metric) => (
              <MenuItem key={metric} value={metric}>
                {metricNames[metric]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress aria-label="Loading alerts" />
          </Box>
        ) : error && !data ? (
          <Alert
            severity="error"
            sx={{ m: 2 }}
            action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}
          >
            Could not load alerts: {error.message}
          </Alert>
        ) : (
          <AlertsTable
            alerts={data.items}
            totalCount={data.totalCount}
            page={params.page}
            pageSize={params.pageSize}
            sortBy={params.sortBy}
            sortDirection={params.sortDirection}
            refreshing={isFetching && isPlaceholderData}
            emptyMessage={filtered ? 'No alerts match these filters.' : 'No alerts yet.'}
            now={now}
            onSortChange={changeSort}
            onPageChange={(page) => updateParams({ page })}
            onPageSizeChange={(pageSize) => updateParams({ pageSize, page: 1 })}
          />
        )}
      </Paper>
    </Box>
  )
}
