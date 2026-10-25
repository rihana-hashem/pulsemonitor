/** Mirrors ReportDto. */
export type Report = {
  reportId: number
  serverId: number
  serverName: string
  requestedByUserId: number
  requestedBy: string
  from: string
  to: string
  status: ReportStatus
  /** Why generation failed; safe to show. */
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
  /** When a completed report is deleted. */
  expiresAt: string | null
}

export type ReportStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed'

export type RequestReportInput = {
  serverId: number
  /** ISO 8601, UTC. */
  from: string
  to: string
}

export type ReportListParams = {
  /** 1-based. */
  page: number
  pageSize: number
}

export const isInProgress = (report: Report) => report.status === 'Pending' || report.status === 'Processing'
