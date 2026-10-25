import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import type { Dashboard } from './types'

export const dashboardKey = ['dashboard'] as const

async function getDashboard(signal?: AbortSignal) {
  const { data } = await apiClient.get<Dashboard>('/api/v1/dashboard', { signal })
  return data
}

export function useDashboard({ poll }: { poll: boolean }) {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: ({ signal }) => getDashboard(signal),
    // Live pushes keep it current; poll only while they are unavailable.
    refetchInterval: poll ? 60_000 : false,
  })
}
