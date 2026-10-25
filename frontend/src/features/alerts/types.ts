import type { SortDirection } from '../../api/types'
import type { AlertMetricType } from '../realtime/types'

/** Mirrors AlertListItemDto. */
export type AlertItem = {
  alertId: number
  serverId: number
  serverName: string
  metricType: AlertMetricType
  status: 'Triggered' | 'Resolved'
  threshold: number
  triggerValue: number
  /** Latest value while open; once resolved, the value that resolved it. */
  lastObservedValue: number | null
  triggeredAt: string
  resolvedAt: string | null
}

export type AlertStatusFilter = 'all' | 'active' | 'resolved'
export type AlertPeriod = '24h' | '7d' | '30d' | 'all'
export type AlertSortField = 'triggeredAt' | 'serverName' | 'metricType'

/** List state, as kept in the URL. */
export type AlertListParams = {
  status: AlertStatusFilter
  serverId?: number
  metricType?: AlertMetricType
  period: AlertPeriod
  sortBy: AlertSortField
  sortDirection: SortDirection
  /** 1-based. */
  page: number
  pageSize: number
}
