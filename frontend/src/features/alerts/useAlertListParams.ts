import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { AlertMetricType } from '../realtime/types'
import type { AlertListParams, AlertPeriod, AlertSortField, AlertStatusFilter } from './types'

export const alertPageSizeOptions = [10, 25, 50, 100]

const defaults: AlertListParams = {
  status: 'all',
  period: '7d',
  sortBy: 'triggeredAt',
  sortDirection: 'desc',
  page: 1,
  pageSize: 25,
}

const statuses: AlertStatusFilter[] = ['all', 'active', 'resolved']
const periods: AlertPeriod[] = ['24h', '7d', '30d', 'all']
const sortFields: AlertSortField[] = ['triggeredAt', 'serverName', 'metricType']
export const metricTypes: AlertMetricType[] = ['CpuUsage', 'MemoryUsage', 'DiskUsage', 'ResponseTimeMs']

function oneOf<T extends string>(value: string | null, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function parse(query: URLSearchParams): AlertListParams {
  const serverId = Number(query.get('serverId'))
  const page = Number(query.get('page'))
  const pageSize = Number(query.get('pageSize'))
  const metric = query.get('metric')

  // Anything hand-edited or stale in the URL falls back to the default.
  return {
    status: oneOf(query.get('status'), statuses, defaults.status),
    serverId: Number.isInteger(serverId) && serverId > 0 ? serverId : undefined,
    metricType: metricTypes.includes(metric as AlertMetricType) ? (metric as AlertMetricType) : undefined,
    period: oneOf(query.get('period'), periods, defaults.period),
    sortBy: oneOf(query.get('sortBy'), sortFields, defaults.sortBy),
    sortDirection: query.get('sortDirection') === 'asc' ? 'asc' : 'desc',
    page: Number.isInteger(page) && page >= 1 ? page : defaults.page,
    pageSize: alertPageSizeOptions.includes(pageSize) ? pageSize : defaults.pageSize,
  }
}

function serialize(params: AlertListParams): URLSearchParams {
  const query = new URLSearchParams()
  // Defaults are left out to keep URLs short.
  if (params.status !== defaults.status) query.set('status', params.status)
  if (params.serverId !== undefined) query.set('serverId', String(params.serverId))
  if (params.metricType !== undefined) query.set('metric', params.metricType)
  if (params.period !== defaults.period) query.set('period', params.period)
  if (params.sortBy !== defaults.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortDirection !== defaults.sortDirection) query.set('sortDirection', params.sortDirection)
  if (params.page !== defaults.page) query.set('page', String(params.page))
  if (params.pageSize !== defaults.pageSize) query.set('pageSize', String(params.pageSize))
  return query
}

/** Alert list state (filters, sort, paging) stored in the URL: survives reloads, works with back/forward, shareable. */
export function useAlertListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parse(searchParams), [searchParams])

  const update = useCallback(
    (changes: Partial<AlertListParams>) => setSearchParams((current) => serialize({ ...parse(current), ...changes })),
    [setSearchParams],
  )

  return [params, update] as const
}
