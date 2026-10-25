import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNotify } from '../../components/notifications/notificationContext'
import { onConnected, onHubEvent } from '../realtime/connection'
import { reportKeys } from './queries'

/**
 * Keeps report lists current and tells the user when their report is ready or failed,
 * on whichever page they are. Mount once, in the app shell.
 */
export function useReportUpdates() {
  const queryClient = useQueryClient()
  const notify = useNotify()

  useEffect(() => {
    const refetch = () => void queryClient.invalidateQueries({ queryKey: reportKeys.lists() })

    const stopStatus = onHubEvent('ReportStatusChanged', (report) => {
      refetch()
      if (report.status === 'Completed') {
        notify(`Report #${report.reportId} for ${report.serverName} is ready.`, 'success')
      } else if (report.status === 'Failed') {
        notify(`Report #${report.reportId} for ${report.serverName} failed.`, 'error')
      }
    })
    // Catch up on changes missed while disconnected.
    const stopCatchingUp = onConnected(refetch)
    return () => {
      stopCatchingUp()
      stopStatus()
    }
  }, [queryClient, notify])
}
