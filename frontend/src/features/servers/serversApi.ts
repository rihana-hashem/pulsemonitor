import { apiClient } from '../../api/client'
import type { PagedResult } from '../../api/types'
import type { CreateServerInput, Server, ServerListParams, UpdateServerInput } from './types'

const baseUrl = '/api/v1/servers'

export async function getServers(params: ServerListParams, signal?: AbortSignal) {
  const { data } = await apiClient.get<PagedResult<Server>>(baseUrl, { params, signal })
  return data
}

export async function getServer(serverId: number, signal?: AbortSignal) {
  const { data } = await apiClient.get<Server>(`${baseUrl}/${serverId}`, { signal })
  return data
}

export async function createServer(input: CreateServerInput) {
  const { data } = await apiClient.post<Server>(baseUrl, input)
  return data
}

export async function updateServer(serverId: number, input: UpdateServerInput) {
  const { data } = await apiClient.put<Server>(`${baseUrl}/${serverId}`, input)
  return data
}

export async function deleteServer(serverId: number) {
  await apiClient.delete(`${baseUrl}/${serverId}`)
}
