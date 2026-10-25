import type { AlertMetricType } from '../realtime/types'
import type { MetricUnit } from './formatters'

/** Display names of the API's metric types (alerts, dashboard). */
export const metricNames: Record<AlertMetricType, string> = {
  CpuUsage: 'CPU usage',
  MemoryUsage: 'Memory usage',
  DiskUsage: 'Disk usage',
  ResponseTimeMs: 'Response time',
}

export function metricUnit(metricType: AlertMetricType): MetricUnit {
  return metricType === 'ResponseTimeMs' ? 'ms' : 'percent'
}
