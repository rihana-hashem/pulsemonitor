import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getLatestMetrics, getMetricsHistory } from './metricsApi'
import type { TimeRange } from './ranges'

// Metrics are collected once a minute; poll at that pace only when live updates are unavailable.
const pollIntervalMs = 60_000

export const metricsKeys = {
  all: (serverId: number) => ['metrics', serverId] as const,
  histories: (serverId: number) => [...metricsKeys.all(serverId), 'history'] as const,
  // Keyed by the range, not by absolute times: each fetch computes "now".
  history: (serverId: number, range: TimeRange['key']) => [...metricsKeys.histories(serverId), range] as const,
  latest: (serverId: number) => [...metricsKeys.all(serverId), 'latest'] as const,
}

type Options = {
  /** Poll for new data; pass false while SignalR pushes updates. */
  poll: boolean
}

export function useMetricsHistory(serverId: number, range: TimeRange, { poll }: Options) {
  return useQuery({
    queryKey: metricsKeys.history(serverId, range.key),
    queryFn: ({ signal }) => getMetricsHistory(serverId, range.minutes, signal),
    refetchInterval: poll ? pollIntervalMs : false,
    // Keep the current charts on screen while another range loads.
    placeholderData: keepPreviousData,
  })
}

export function useLatestMetrics(serverId: number, { poll }: Options) {
  return useQuery({
    queryKey: metricsKeys.latest(serverId),
    queryFn: ({ signal }) => getLatestMetrics(serverId, signal),
    refetchInterval: poll ? pollIntervalMs : false,
  })
}
