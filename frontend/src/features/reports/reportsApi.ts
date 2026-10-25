import { apiClient } from '../../api/client'
import type { PagedResult } from '../../api/types'
import type { Report, ReportListParams, RequestReportInput } from './types'

const baseUrl = '/api/v1/reports'

export async function getReports(params: ReportListParams, signal?: AbortSignal) {
  const { data } = await apiClient.get<PagedResult<Report>>(baseUrl, { params, signal })
  return data
}

/** Queues the report; it starts as Pending and ReportStatusChanged reports its progress. */
export async function requestReport(input: RequestReportInput) {
  const { data } = await apiClient.post<Report>(baseUrl, input)
  return data
}

/**
 * The report's HTML. Fetched with the access token like every other call (there are no
 * public report links), so it cannot be a plain <a href> or <iframe src>.
 */
export async function getReportFile(reportId: number, signal?: AbortSignal) {
  const response = await apiClient.get<string>(`${baseUrl}/${reportId}/download`, {
    responseType: 'text',
    headers: { Accept: 'text/html' },
    signal,
  })
  // attachment; filename=pulsemonitor-report-5-WEB-01-20261025.html; filename*=...
  const fileName = /filename="?([^";]+)"?/.exec(String(response.headers['content-disposition'] ?? ''))?.[1]
  return { html: response.data, fileName: fileName ?? `pulsemonitor-report-${reportId}.html` }
}

/** Saves the report file through the browser's normal download flow. */
export async function downloadReport(reportId: number) {
  const { html, fileName } = await getReportFile(reportId)
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // The click starts the download synchronously; the URL is no longer needed after it.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
