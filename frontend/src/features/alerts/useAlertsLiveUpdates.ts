import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { onConnected, onHubEvent } from '../realtime/connection'
import { alertKeys } from './queries'

/** Refetches the alert lists when an alert is triggered or resolved, and after a reconnect. */
export function useAlertsLiveUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const refetch = () => void queryClient.invalidateQueries({ queryKey: alertKeys.all })
    const stopAlerts = onHubEvent('AlertChanged', refetch)
    const stopCatchingUp = onConnected(refetch)
    return () => {
      stopCatchingUp()
      stopAlerts()
    }
  }, [queryClient])
}
