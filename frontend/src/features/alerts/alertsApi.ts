import { apiClient } from '../../api/client'
import type { PagedResult } from '../../api/types'
import type { AlertItem, AlertListParams, AlertPeriod } from './types'

const periodMinutes: Record<Exclude<AlertPeriod, 'all'>, number> = {
  '24h': 24 * 60,
  '7d': 7 * 24 * 60,
  '30d': 30 * 24 * 60,
}

export async function getAlerts(params: AlertListParams, signal?: AbortSignal) {
  // The period is relative to "now" at request time, so a refetch includes new alerts.
  const from =
    params.period === 'all' ? undefined : new Date(Date.now() - periodMinutes[params.period] * 60_000).toISOString()

  const { data } = await apiClient.get<PagedResult<AlertItem>>('/api/v1/alerts', {
    params: {
      status: params.status === 'active' ? 'Triggered' : params.status === 'resolved' ? 'Resolved' : undefined,
      serverId: params.serverId,
      metricType: params.metricType,
      from,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  })
  return data
}
