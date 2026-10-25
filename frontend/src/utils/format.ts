const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Parses a UTC timestamp from the API. The API currently sends UTC values without a
 * "Z" suffix (e.g. "2026-10-24T17:00:50.275"), which JavaScript would read as local
 * time, so a missing offset is treated as UTC.
 */
export function parseApiDate(value: string): Date {
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  return new Date(hasOffset ? value : `${value}Z`)
}

/** A short duration, e.g. "45 s", "12 min", "3 h 20 min", "2 d 5 h". */
export function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60_000)
  if (minutes < 1) return `${Math.max(0, Math.round(milliseconds / 1000))} s`
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`
  const days = Math.floor(hours / 24)
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`
}

/** Formats an API timestamp in the viewer's locale and time zone. */
export function formatDateTime(value: string): string {
  return dateTimeFormat.format(parseApiDate(value))
}
