import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useReportFile } from './queries'
import type { Report } from './types'

type ReportViewerDialogProps = {
  report: Report
  downloading: boolean
  onDownload: () => void
  onClose: () => void
}

/** Shows a completed report inside the app. Mount only while open. */
export function ReportViewerDialog({ report, downloading, onDownload, onClose }: ReportViewerDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const { data, error, isPending, refetch } = useReportFile(report.reportId)

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} maxWidth="lg" fullWidth>
      <DialogTitle>
        Report #{report.reportId}: {report.serverName}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, height: { sm: '75vh' }, display: 'flex' }}>
        {isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', flex: 1, py: 8 }}>
            <CircularProgress aria-label="Loading report" />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{ m: 2, flex: 1, alignSelf: 'flex-start' }}
            action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}
          >
            Could not load the report: {error.message}
          </Alert>
        ) : (
          // sandbox="" : no scripts, and a unique origin, so the file can never act as the app.
          <Box
            component="iframe"
            title={`Report #${report.reportId}`}
            sandbox=""
            srcDoc={data.html}
            sx={{ border: 0, flex: 1, width: '100%', bgcolor: '#fff' }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onDownload} loading={downloading}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  )
}
