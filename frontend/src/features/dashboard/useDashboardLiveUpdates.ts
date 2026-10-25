import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { onConnected, onHubEvent, watchDashboard } from '../realtime/connection'
import { dashboardKey } from './queries'
import type { Dashboard } from './types'

/**
 * Keeps the dashboard current from SignalR while mounted:
 * - each pushed reading updates that server's card in the cache (no request);
 * - alert changes refetch the overview, so counts and the alerts list stay exact.
 */
export function useDashboardLiveUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refetch = () => void queryClient.invalidateQueries({ queryKey: dashboardKey })

    const stopWatching = watchDashboard()

    const stopReadings = onHubEvent('DashboardMetricsUpdated', (summary) => {
      const current = queryClient.getQueryData<Dashboard>(dashboardKey)
      if (!current) return

      // A server added since the last fetch isn't in the list yet: fetch it.
      if (!current.servers.some((s) => s.serverId === summary.serverId)) {
        refetch()
        return
      }

      queryClient.setQueryData<Dashboard>(dashboardKey, {
        ...current,
        servers: current.servers.map((server) =>
          server.serverId !== summary.serverId
            ? server
            : {
                ...server,
                latestReading: {
                  collectedAt: summary.collectedAt,
                  cpuUsage: summary.cpuUsage,
                  memoryUsage: summary.memoryUsage,
                  diskUsage: summary.diskUsage,
                  responseTimeMs: summary.responseTimeMs,
                  status: summary.status,
                },
              },
        ),
      })
    })

    const stopAlerts = onHubEvent('AlertChanged', refetch)

    // Anything pushed while disconnected was missed; catch up after every (re)connect.
    const stopCatchingUp = onConnected(refetch)

    return () => {
      stopCatchingUp()
      stopAlerts()
      stopReadings()
      stopWatching()
    }
  }, [queryClient])
}
