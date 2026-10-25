import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { ActiveAlertsList } from '../features/dashboard/ActiveAlertsList'
import { useDashboard } from '../features/dashboard/queries'
import { serverHealth } from '../features/dashboard/serverHealth'
import { ServerHealthCard } from '../features/dashboard/ServerHealthCard'
import { useDashboardLiveUpdates } from '../features/dashboard/useDashboardLiveUpdates'
import { StatTile } from '../features/metrics/StatTile'
import { useConnectionStatus } from '../features/realtime/connection'
import { LiveStatusChip } from '../features/realtime/LiveStatusChip'
import { useNow } from '../hooks/useNow'

export default function DashboardPage() {
  useDashboardLiveUpdates()
  const poll = useConnectionStatus() !== 'connected'
  const { data, error, refetch } = useDashboard({ poll })
  // Re-evaluates "stale" even when no new data arrives.
  const now = useNow(30_000)

  if (error && !data) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
        Could not load the dashboard: {error.message}
      </Alert>
    )
  }

  if (!data) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading dashboard" />
      </Box>
    )
  }

  const servers = data.servers.map((server) => ({ server, health: serverHealth(server, now) }))
  const count = (predicate: (h: (typeof servers)[number]) => boolean) => servers.filter(predicate).length

  const monitored = count(({ server }) => server.isActive)
  const healthy = count(({ health }) => health === 'healthy')
  const activeAlerts = data.servers.reduce((sum, s) => sum + s.activeAlerts.length, 0)
  const alertingServers = count(({ server }) => server.activeAlerts.length > 0)
  const needAttention = count(({ health }) => health === 'stale' || health === 'noData')

  return (
    <Box component="section">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', rowGap: 1 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>Live health of every monitored server.</Typography>
        </Box>
        <LiveStatusChip />
      </Stack>

      {/* Headline numbers */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, mb: 3 }}>
        <StatTile
          label="Servers monitored"
          value={String(monitored)}
          caption={`of ${data.servers.length} ${data.servers.length === 1 ? 'server' : 'servers'}`}
        />
        <StatTile label="Healthy" value={String(healthy)} caption="Within all thresholds" />
        <StatTile
          label="Active alerts"
          value={String(activeAlerts)}
          caption={activeAlerts === 0 ? 'Nothing needs action' : `On ${alertingServers} ${alertingServers === 1 ? 'server' : 'servers'}`}
        />
        <StatTile label="No current data" value={String(needAttention)} caption="Stale or never reported" />
      </Box>

      {data.servers.length === 0 ? (
        <Alert severity="info" action={<Button component={RouterLink} to="/servers" color="inherit" size="small">Servers</Button>}>
          No servers yet. Add one on the Servers page to start monitoring.
        </Alert>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, alignItems: 'start' }}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            {servers.map(({ server, health }) => (
              <ServerHealthCard key={server.serverId} server={server} health={health} thresholds={data.thresholds} />
            ))}
          </Box>
          <ActiveAlertsList servers={data.servers} />
        </Box>
      )}
    </Box>
  )
}
