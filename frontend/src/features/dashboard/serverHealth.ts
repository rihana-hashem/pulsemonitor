import { parseApiDate } from '../../utils/format'
import type { ServerOverview } from './types'

export type ServerHealth = 'healthy' | 'alerting' | 'stale' | 'noData' | 'paused'

/**
 * Readings arrive every minute. Without one for this long, the metrics job (or the API)
 * is probably not running, so the numbers on screen are out of date.
 */
export const staleAfterMs = 3 * 60_000

export function serverHealth(server: ServerOverview, now: number): ServerHealth {
  if (!server.isActive) return 'paused'
  if (!server.latestReading) return 'noData'
  // Out-of-date numbers matter more than the alerts they show.
  if (now - parseApiDate(server.latestReading.collectedAt).getTime() > staleAfterMs) return 'stale'
  if (server.activeAlerts.length > 0) return 'alerting'
  return 'healthy'
}
