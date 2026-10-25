import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import Box from '@mui/material/Box'
import Chip, { type ChipProps } from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { ReactElement } from 'react'
import { Link as RouterLink } from 'react-router'
import { formatDateTime, formatDuration, parseApiDate } from '../../utils/format'
import type { Report, ReportStatus } from './types'

const reportPageSizeOptions = [10, 25, 50]

type ReportsTableProps = {
  reports: Report[]
  totalCount: number
  page: number
  pageSize: number
  refreshing: boolean
  /** Admins see everyone's reports, so show who requested each one. */
  showRequestedBy: boolean
  /** The report being downloaded, to show progress on its button. */
  downloadingId: number | null
  /** For the "available for" countdown. */
  now: number
  onView: (report: Report) => void
  onDownload: (report: Report) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

// Status color always comes with an icon and a label.
const statusDisplay: Record<ReportStatus, { label: string; color: ChipProps['color']; icon: ReactElement }> = {
  Pending: { label: 'Queued', color: 'default', icon: <HourglassEmptyOutlinedIcon /> },
  Processing: { label: 'Generating', color: 'info', icon: <CircularProgress size={14} color="inherit" /> },
  Completed: { label: 'Ready', color: 'success', icon: <CheckCircleOutlinedIcon /> },
  Failed: { label: 'Failed', color: 'error', icon: <ErrorOutlineOutlinedIcon /> },
}

const hideOnPhone = { display: { xs: 'none', md: 'table-cell' } }

const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}

function StatusChip({ report }: { report: Report }) {
  const { label, color, icon } = statusDisplay[report.status]
  return (
    // A failed report's reason is in the tooltip; on phones the label is too.
    <Tooltip title={report.errorMessage ?? label}>
      <Chip
        size="small"
        variant="outlined"
        color={color}
        icon={icon}
        label={label}
        aria-label={report.errorMessage ? `${label}: ${report.errorMessage}` : label}
        sx={{
          '& .MuiChip-label': { display: { xs: 'none', sm: 'block' } },
          '& .MuiChip-icon': { mr: { xs: '-6px', sm: 0 }, ml: '5px' },
        }}
      />
    </Tooltip>
  )
}

export function ReportsTable(props: ReportsTableProps) {
  const { reports, showRequestedBy, now } = props
  const columnCount = showRequestedBy ? 7 : 6

  return (
    <Box>
      <Box sx={{ height: 4 }}>{props.refreshing && <LinearProgress />}</Box>
      <TableContainer>
        <Table aria-label="Reports" sx={{ '& .MuiTableCell-root': { px: { xs: 0.75, sm: 2 } } }}>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Server</TableCell>
              <TableCell sx={hideOnPhone}>Period</TableCell>
              {showRequestedBy && <TableCell sx={hideOnPhone}>Requested by</TableCell>}
              <TableCell sx={hideOnPhone}>Requested</TableCell>
              <TableCell sx={hideOnPhone}>Available for</TableCell>
              <TableCell align="right">
                <Box component="span" sx={{ '@media (max-width: 599.95px)': srOnly }}>
                  Actions
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount}>
                  <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    No reports yet. Choose a server and a period above to generate one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const ready = report.status === 'Completed'
                const name = `report #${report.reportId} for ${report.serverName}`
                return (
                  <TableRow key={report.reportId} hover>
                    <TableCell>
                      <StatusChip report={report} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Link component={RouterLink} to={`/servers/${report.serverId}`} underline="hover">
                        {report.serverName}
                      </Link>
                      <Typography variant="caption" component="div" sx={{ color: 'text.secondary' }}>
                        #{report.reportId}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...hideOnPhone, color: 'text.secondary' }}>
                      {formatDateTime(report.from)} – {formatDateTime(report.to)}
                    </TableCell>
                    {showRequestedBy && <TableCell sx={hideOnPhone}>{report.requestedBy}</TableCell>}
                    <TableCell sx={{ ...hideOnPhone, whiteSpace: 'nowrap' }}>{formatDateTime(report.createdAt)}</TableCell>
                    <TableCell sx={{ ...hideOnPhone, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                      {report.expiresAt ? (
                        <Tooltip title={`Deleted on ${formatDateTime(report.expiresAt)}`}>
                          <span>{formatDuration(parseApiDate(report.expiresAt).getTime() - now)}</span>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {/* span: a disabled button fires no events, so the tooltip needs a wrapper. */}
                      <Tooltip title={ready ? 'View' : 'Available when ready'}>
                        <span>
                          <IconButton size="small" aria-label={`View ${name}`} disabled={!ready} onClick={() => props.onView(report)}>
                            <VisibilityOutlinedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={ready ? 'Download' : 'Available when ready'}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Download ${name}`}
                            disabled={!ready}
                            loading={props.downloadingId === report.reportId}
                            onClick={() => props.onDownload(report)}
                          >
                            <FileDownloadOutlinedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={props.totalCount}
        page={props.totalCount === 0 ? 0 : props.page - 1}
        rowsPerPage={props.pageSize}
        rowsPerPageOptions={reportPageSizeOptions}
        onPageChange={(_, page) => props.onPageChange(page + 1)}
        onRowsPerPageChange={(event) => props.onPageSizeChange(Number(event.target.value))}
      />
    </Box>
  )
}
