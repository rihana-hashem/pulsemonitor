import { useEffect, useState } from 'react'

/** The current time, updated every `intervalMs`, for "x minutes ago" and staleness checks. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
