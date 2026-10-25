import { apiClient } from '../../api/client'

export type HealthStatus = 'Healthy' | 'Degraded' | 'Unhealthy'

/** Mirrors the JSON written by HealthCheckResponseWriter in the API. */
export type HealthReport = {
  status: HealthStatus
  totalDurationMs: number
  checks: {
    name: string
    status: HealthStatus
    description: string | null
    durationMs: number
  }[]
}

export async function getReadiness(signal?: AbortSignal): Promise<HealthReport> {
  const { data } = await apiClient.get<HealthReport>('/health/ready', {
    signal,
    // 503 means "Unhealthy" and still carries the report; treat it as data, not an error.
    validateStatus: (status) => status === 200 || status === 503,
  })
  return data
}
