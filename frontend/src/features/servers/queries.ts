import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardKey } from '../dashboard/queries'
import { createServer, deleteServer, getServer, getServers, updateServer } from './serversApi'
import type { CreateServerInput, ServerListParams, UpdateServerInput } from './types'

/** Query keys in one place, so invalidation always matches what was cached. */
export const serverKeys = {
  all: ['servers'] as const,
  lists: () => [...serverKeys.all, 'list'] as const,
  list: (params: ServerListParams) => [...serverKeys.lists(), params] as const,
  detail: (serverId: number) => [...serverKeys.all, 'detail', serverId] as const,
}

// Server changes are not pushed over SignalR, so refresh every list that shows servers.
function refreshServerLists(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: serverKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: dashboardKey }),
  ])
}

export function useServers(params: ServerListParams) {
  return useQuery({
    queryKey: serverKeys.list(params),
    queryFn: ({ signal }) => getServers(params, signal),
    // Keep showing the current page while the next page / sort / search loads.
    placeholderData: keepPreviousData,
  })
}

export function useServer(serverId: number) {
  return useQuery({
    queryKey: serverKeys.detail(serverId),
    queryFn: ({ signal }) => getServer(serverId, signal),
  })
}

export function useCreateServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateServerInput) => createServer(input),
    onSuccess: () => refreshServerLists(queryClient),
  })
}

export function useUpdateServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ serverId, input }: { serverId: number; input: UpdateServerInput }) =>
      updateServer(serverId, input),
    onSuccess: (server) => {
      queryClient.setQueryData(serverKeys.detail(server.serverId), server)
      return refreshServerLists(queryClient)
    },
  })
}

export function useDeleteServer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (serverId: number) => deleteServer(serverId),
    onSuccess: (_, serverId) => {
      queryClient.removeQueries({ queryKey: serverKeys.detail(serverId) })
      return refreshServerLists(queryClient)
    },
  })
}
