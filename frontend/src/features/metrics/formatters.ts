const percentFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
const integerFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const sizeFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

export type MetricUnit = 'percent' | 'ms'

export function formatMetric(value: number, unit: MetricUnit): string {
  return unit === 'percent' ? `${percentFormat.format(value)}%` : `${integerFormat.format(value)} ms`
}

/** Megabytes to a short size, e.g. 26000 -> "25.4 GB". */
export function formatMegabytes(megabytes: number): string {
  return megabytes >= 1024 ? `${sizeFormat.format(megabytes / 1024)} GB` : `${integerFormat.format(megabytes)} MB`
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dayTimeFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
const fullFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** Axis tick: time of day for ranges up to a day, weekday + time beyond. */
export function formatTick(date: Date, rangeMinutes: number): string {
  return rangeMinutes > 24 * 60 ? dayTimeFormat.format(date) : timeFormat.format(date)
}

export function formatFullTime(date: Date): string {
  return fullFormat.format(date)
}
