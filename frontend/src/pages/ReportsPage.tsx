import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { isApiError } from '../api/ApiError'
import { useNotify } from '../components/notifications/notificationContext'
import { useIsAdmin } from '../features/auth/authStore'
import { useConnectionStatus } from '../features/realtime/connection'
import { LiveStatusChip } from '../features/realtime/LiveStatusChip'
import { useReports } from '../features/reports/queries'
import { downloadReport } from '../features/reports/reportsApi'
import { ReportsTable } from '../features/reports/ReportsTable'
import { ReportViewerDialog } from '../features/reports/ReportViewerDialog'
import { RequestReportForm } from '../features/reports/RequestReportForm'
import type { Report } from '../features/reports/types'
import { useNow } from '../hooks/useNow'

export default function ReportsPage() {
  const isAdmin = useIsAdmin()
  const notify = useNotify()
  const poll = useConnectionStatus() !== 'connected'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useReports({ page, pageSize }, { poll })
  const [viewing, setViewing] = useState<Report | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  // Keeps "Available for ..." current.
  const now = useNow(60_000)

  const download = async (report: Report) => {
    setDownloadingId(report.reportId)
    try {
      await downloadReport(report.reportId)
    } catch (error) {
      notify(`Could not download the report: ${isApiError(error) ? error.message : 'unexpected error'}`, 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <Box component="section">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', rowGap: 1 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Reports
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Performance reports for a server and period. They are generated in the background and kept for 7 days.
          </Typography>
        </Box>
        <LiveStatusChip />
      </Stack>

      <Paper variant="outlined">
        <Typography variant="h6" component="h2" sx={{ px: 2, pt: 2 }}>
          New report
        </Typography>
        <RequestReportForm />
        <Divider />
        <Typography variant="h6" component="h2" sx={{ px: 2, pt: 2 }}>
          {isAdmin ? 'All reports' : 'My reports'}
        </Typography>

        {isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress aria-label="Loading reports" />
          </Box>
        ) : error && !data ? (
          <Alert
            severity="error"
            sx={{ m: 2 }}
            action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}
          >
            Could not load reports: {error.message}
          </Alert>
        ) : (
          <ReportsTable
            reports={data.items}
            totalCount={data.totalCount}
            page={page}
            pageSize={pageSize}
            refreshing={isFetching && isPlaceholderData}
            showRequestedBy={isAdmin}
            downloadingId={downloadingId}
            now={now}
            onView={setViewing}
            onDownload={download}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        )}
      </Paper>

      {viewing && (
        <ReportViewerDialog
          report={viewing}
          downloading={downloadingId === viewing.reportId}
          onDownload={() => download(viewing)}
          onClose={() => setViewing(null)}
        />
      )}
    </Box>
  )
}
