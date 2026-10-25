import { apiClient } from '../../api/client'
import type { LatestMetrics, MetricsHistory } from './types'

const serverUrl = (serverId: number) => `/api/v1/servers/${serverId}/metrics`

/** History for the `minutes` before now, bucketed by the API (at most 360 points). */
export async function getMetricsHistory(serverId: number, minutes: number, signal?: AbortSignal) {
  const to = new Date()
  const from = new Date(to.getTime() - minutes * 60_000)

  const { data } = await apiClient.get<MetricsHistory>(serverUrl(serverId), {
    params: { from: from.toISOString(), to: to.toISOString() },
    signal,
  })
  return data
}

/** The latest snapshot, or null when no metrics have been collected yet (204). */
export async function getLatestMetrics(serverId: number, signal?: AbortSignal) {
  const response = await apiClient.get<LatestMetrics | ''>(`${serverUrl(serverId)}/latest`, { signal })
  return response.status === 204 || response.data === '' ? null : response.data
}
