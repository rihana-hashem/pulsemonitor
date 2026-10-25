import { parseApiDate } from '../../utils/format'
import type { MetricPoint } from './types'

export type Series = {
  /** Bucket start times; `null` values in the series below mark gaps. */
  x: Date[]
  points: (MetricPoint | null)[]
}

/**
 * Turns API points into chart arrays. Where buckets are missing (no metrics were
 * collected, e.g. the API was down), a null point is inserted so the line breaks
 * instead of drawing a misleading straight segment across the gap.
 */
export function toSeries(points: MetricPoint[], bucketMinutes: number): Series {
  const bucketMs = bucketMinutes * 60_000
  const x: Date[] = []
  const values: (MetricPoint | null)[] = []

  points.forEach((point, index) => {
    const time = parseApiDate(point.timestamp)

    if (index > 0 && time.getTime() - x[x.length - 1].getTime() > bucketMs * 1.5) {
      x.push(new Date(x[x.length - 1].getTime() + bucketMs))
      values.push(null)
    }

    x.push(time)
    values.push(point)
  })

  return { x, points: values }
}

/** Highest value of `pick` across the points, or null when there are none. */
export function peakOf(points: MetricPoint[], pick: (point: MetricPoint) => number): number | null {
  return points.length === 0 ? null : Math.max(...points.map(pick))
}
