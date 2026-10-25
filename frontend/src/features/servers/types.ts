import type { SortDirection } from '../../api/types'

/** Mirrors ServerDto in PulseMonitor.Application.Servers. */
export type Server = {
  serverId: number
  serverName: string
  ipAddress: string
  description: string | null
  isActive: boolean
  /** UTC timestamp. */
  createdAt: string
}

export type ServerSortField = 'name' | 'ipAddress' | 'createdAt'

/** Query parameters of GET /api/v1/servers. */
export type ServerListParams = {
  search?: string
  isActive?: boolean
  sortBy: ServerSortField
  sortDirection: SortDirection
  /** 1-based. */
  page: number
  pageSize: number
}

export type CreateServerInput = {
  serverName: string
  ipAddress: string
  description?: string | null
}

export type UpdateServerInput = CreateServerInput & {
  isActive: boolean
}
