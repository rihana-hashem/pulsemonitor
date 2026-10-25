export type RangeKey = '1h' | '6h' | '24h' | '7d'

export type TimeRange = {
  key: RangeKey
  label: string
  /** Shown after values, e.g. "Peak 95% in the last 24 hours". */
  phrase: string
  minutes: number
}

export const timeRanges: TimeRange[] = [
  { key: '1h', label: '1h', phrase: 'in the last hour', minutes: 60 },
  { key: '6h', label: '6h', phrase: 'in the last 6 hours', minutes: 6 * 60 },
  { key: '24h', label: '24h', phrase: 'in the last 24 hours', minutes: 24 * 60 },
  { key: '7d', label: '7d', phrase: 'in the last 7 days', minutes: 7 * 24 * 60 },
]

export const defaultRange = timeRanges[2]

export function findRange(key: string | null): TimeRange {
  return timeRanges.find((range) => range.key === key) ?? defaultRange
}
