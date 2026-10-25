import type { AlertMetricType } from '../realtime/types'

/** Mirrors DashboardDto and friends in PulseMonitor.Application.Dashboard. */
export type Dashboard = {
  thresholds: AlertThresholds
  servers: ServerOverview[]
}

export type AlertThresholds = {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  responseTimeMs: number
}

export type ServerOverview = {
  serverId: number
  serverName: string
  ipAddress: string
  isActive: boolean
  latestReading: ServerReading | null
  activeAlerts: ActiveAlert[]
}

export type ServerReading = {
  collectedAt: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  responseTimeMs: number
  status: string
}

export type ActiveAlert = {
  alertId: number
  metricType: AlertMetricType
  triggerValue: number
  lastObservedValue: number | null
  threshold: number
  triggeredAt: string
}
