import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getReportFile, getReports, requestReport } from './reportsApi'
import { isInProgress, type ReportListParams, type RequestReportInput } from './types'

export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (params: ReportListParams) => [...reportKeys.lists(), params] as const,
  file: (reportId: number) => [...reportKeys.all, 'file', reportId] as const,
}

export function useReports(params: ReportListParams, { poll }: { poll: boolean }) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: ({ signal }) => getReports(params, signal),
    placeholderData: keepPreviousData,
    // ReportStatusChanged pushes trigger refetches; while they are unavailable, poll
    // only as long as a report on this page is still being generated.
    refetchInterval: (query) => (poll && query.state.data?.items.some(isInProgress) ? 5_000 : false),
  })
}

export function useReportFile(reportId: number) {
  return useQuery({
    queryKey: reportKeys.file(reportId),
    queryFn: ({ signal }) => getReportFile(reportId, signal),
    // A completed report never changes; drop the HTML once the viewer closes.
    staleTime: Infinity,
    gcTime: 0,
  })
}

export function useRequestReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RequestReportInput) => requestReport(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportKeys.lists() }),
  })
}
