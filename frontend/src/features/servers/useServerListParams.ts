import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { SortDirection } from '../../api/types'
import type { ServerListParams, ServerSortField } from './types'

export const pageSizeOptions = [10, 25, 50]

const defaults: ServerListParams = {
  sortBy: 'name',
  sortDirection: 'asc',
  page: 1,
  pageSize: pageSizeOptions[0],
}

const sortFields: ServerSortField[] = ['name', 'ipAddress', 'createdAt']

function parse(query: URLSearchParams): ServerListParams {
  const sortBy = query.get('sortBy') as ServerSortField | null
  const page = Number(query.get('page'))
  const pageSize = Number(query.get('pageSize'))
  const isActive = query.get('isActive')

  // Anything hand-edited or stale in the URL falls back to the default.
  return {
    search: query.get('search') || undefined,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    sortBy: sortBy && sortFields.includes(sortBy) ? sortBy : defaults.sortBy,
    sortDirection: (query.get('sortDirection') === 'desc' ? 'desc' : 'asc') satisfies SortDirection,
    page: Number.isInteger(page) && page >= 1 ? page : defaults.page,
    pageSize: pageSizeOptions.includes(pageSize) ? pageSize : defaults.pageSize,
  }
}

function serialize(params: ServerListParams): URLSearchParams {
  const query = new URLSearchParams()
  // Defaults are left out to keep URLs short.
  if (params.search) query.set('search', params.search)
  if (params.isActive !== undefined) query.set('isActive', String(params.isActive))
  if (params.sortBy !== defaults.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortDirection !== defaults.sortDirection) query.set('sortDirection', params.sortDirection)
  if (params.page !== defaults.page) query.set('page', String(params.page))
  if (params.pageSize !== defaults.pageSize) query.set('pageSize', String(params.pageSize))
  return query
}

/**
 * Server list state (search, filter, sort, paging) stored in the URL, so it survives
 * reloads, works with back/forward and can be shared as a link.
 */
export function useServerListParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => parse(searchParams), [searchParams])

  const update = useCallback(
    (changes: Partial<ServerListParams>, options?: { replace?: boolean }) => {
      setSearchParams((current) => serialize({ ...parse(current), ...changes }), options)
    },
    [setSearchParams],
  )

  return [params, update] as const
}
