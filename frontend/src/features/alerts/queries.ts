import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getAlerts } from './alertsApi'
import type { AlertListParams } from './types'

export const alertKeys = {
  all: ['alerts'] as const,
  list: (params: AlertListParams) => [...alertKeys.all, 'list', params] as const,
}

export function useAlerts(params: AlertListParams, { poll }: { poll: boolean }) {
  return useQuery({
    queryKey: alertKeys.list(params),
    queryFn: ({ signal }) => getAlerts(params, signal),
    // Keep the current page on screen while the next page / filter loads.
    placeholderData: keepPreviousData,
    // AlertChanged pushes trigger refetches; poll only while they are unavailable.
    refetchInterval: poll ? 60_000 : false,
  })
}
