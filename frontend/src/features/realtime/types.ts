import type { LatestMetrics } from '../metrics/types'
import type { Report } from '../reports/types'

/** Client events of the API's MonitoringHub (see Hubs/MonitoringMessages.cs). */
export type HubEvents = {
  ServerMetricsUpdated: ServerMetricsUpdate
  DashboardMetricsUpdated: ServerMetricsSummary
  AlertChanged: AlertNotification
  PresenceChanged: OnlineUser[]
  /** Sent only to the user who requested the report. */
  ReportStatusChanged: Report
}

export type ServerMetricsUpdate = {
  serverId: number
  metrics: LatestMetrics
}

/** Compact reading sent to the dashboard group for every server. */
export type ServerMetricsSummary = {
  serverId: number
  serverName: string
  collectedAt: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  responseTimeMs: number
  status: string
}

export type AlertMetricType = 'CpuUsage' | 'MemoryUsage' | 'DiskUsage' | 'ResponseTimeMs'

export type AlertNotification = {
  serverId: number
  serverName: string
  metricType: AlertMetricType
  status: 'Triggered' | 'Resolved'
  value: number
  threshold: number
  occurredAt: string
}

export type OnlineUser = {
  userId: number
  userName: string
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
