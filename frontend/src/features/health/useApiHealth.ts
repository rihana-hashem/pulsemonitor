import { useQuery } from '@tanstack/react-query'
import { getReadiness } from './healthApi'

const pollIntervalMs = 30_000

/** Polls the API readiness endpoint while the tab is visible. */
export function useApiHealth() {
  return useQuery({
    queryKey: ['health', 'ready'],
    queryFn: ({ signal }) => getReadiness(signal),
    refetchInterval: pollIntervalMs,
    // A failed poll is itself the answer ("unreachable"); the next poll is the retry.
    retry: false,
  })
}
