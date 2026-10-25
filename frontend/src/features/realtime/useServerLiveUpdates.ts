import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { metricsKeys } from '../metrics/queries'
import { onConnected, onHubEvent, watchServer } from './connection'

/**
 * Keeps a server's metrics current from SignalR pushes while the component is mounted:
 * - the latest reading is written straight into the cache (no request);
 * - the history is refetched, because its points are server-side averages per bucket.
 */
export function useServerLiveUpdates(serverId: number) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refreshHistory = () => queryClient.invalidateQueries({ queryKey: metricsKeys.histories(serverId) })

    const stopWatching = watchServer(serverId)

    const stopListening = onHubEvent('ServerMetricsUpdated', (update) => {
      if (update.serverId !== serverId) return
      queryClient.setQueryData(metricsKeys.latest(serverId), update.metrics)
      void refreshHistory()
    })

    // Readings pushed while disconnected were missed; catch up after every (re)connect.
    const stopCatchingUp = onConnected(() => {
      void queryClient.invalidateQueries({ queryKey: metricsKeys.all(serverId) })
    })

    return () => {
      stopCatchingUp()
      stopListening()
      stopWatching()
    }
  }, [serverId, queryClient])
}
