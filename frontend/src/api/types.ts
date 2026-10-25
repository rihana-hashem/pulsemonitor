/** Mirrors PagedResult<T> in PulseMonitor.Application.Common.Models. */
export type PagedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type SortDirection = 'asc' | 'desc'
