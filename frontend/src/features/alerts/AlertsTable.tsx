import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import type { SortDirection } from '../../api/types'
import { formatDateTime, formatDuration, parseApiDate } from '../../utils/format'
import { formatMetric } from '../metrics/formatters'
import { metricNames, metricUnit } from '../metrics/labels'
import type { AlertItem, AlertSortField } from './types'
import { alertPageSizeOptions } from './useAlertListParams'

type AlertsTableProps = {
  alerts: AlertItem[]
  totalCount: number
  page: number
  pageSize: number
  sortBy: AlertSortField
  sortDirection: SortDirection
  refreshing: boolean
  emptyMessage: string
  /** For the "open for" duration of active alerts. */
  now: number
  onSortChange: (field: AlertSortField) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const hideOnPhone = { display: { xs: 'none', md: 'table-cell' } }

export function AlertsTable(props: AlertsTableProps) {
  const { alerts, sortBy, sortDirection, onSortChange, now } = props

  const sortableHeader = (field: AlertSortField, label: string) => (
    <TableSortLabel
      active={sortBy === field}
      direction={sortBy === field ? sortDirection : field === 'triggeredAt' ? 'desc' : 'asc'}
      onClick={() => onSortChange(field)}
    >
      {label}
    </TableSortLabel>
  )

  return (
    <Box>
      <Box sx={{ height: 4 }}>{props.refreshing && <LinearProgress />}</Box>
      <TableContainer>
        <Table aria-label="Alerts" sx={{ '& .MuiTableCell-root': { px: { xs: 0.75, sm: 2 } } }}>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell sortDirection={sortBy === 'serverName' ? sortDirection : false}>
                {sortableHeader('serverName', 'Server')}
              </TableCell>
              <TableCell sortDirection={sortBy === 'metricType' ? sortDirection : false}>
                {sortableHeader('metricType', 'Metric')}
              </TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right" sx={hideOnPhone}>Threshold</TableCell>
              <TableCell sx={hideOnPhone} sortDirection={sortBy === 'triggeredAt' ? sortDirection : false}>
                {sortableHeader('triggeredAt', 'Triggered')}
              </TableCell>
              <TableCell sx={hideOnPhone}>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>{props.emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => {
                const active = alert.status === 'Triggered'
                const unit = metricUnit(alert.metricType)
                const started = parseApiDate(alert.triggeredAt).getTime()
                const ended = alert.resolvedAt ? parseApiDate(alert.resolvedAt).getTime() : now
                return (
                  <TableRow key={alert.alertId} hover>
                    <TableCell>
                      {/* Status color always with an icon and a label (phones: icon only, label in the tooltip). */}
                      <Tooltip title={active ? 'Active' : 'Resolved'}>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={active ? 'error' : 'success'}
                          icon={active ? <WarningAmberIcon /> : <CheckCircleOutlinedIcon />}
                          label={active ? 'Active' : 'Resolved'}
                          aria-label={active ? 'Active' : 'Resolved'}
                          sx={{
                            '& .MuiChip-label': { display: { xs: 'none', sm: 'block' } },
                            '& .MuiChip-icon': { mr: { xs: '-6px', sm: 0 } },
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Link component={RouterLink} to={`/servers/${alert.serverId}`} underline="hover">
                        {alert.serverName}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{metricNames[alert.metricType] ?? alert.metricType}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMetric(alert.triggerValue, unit)}
                    </TableCell>
                    <TableCell align="right" sx={{ ...hideOnPhone, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMetric(alert.threshold, unit)}
                    </TableCell>
                    <TableCell sx={{ ...hideOnPhone, whiteSpace: 'nowrap' }}>{formatDateTime(alert.triggeredAt)}</TableCell>
                    <TableCell sx={{ ...hideOnPhone, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                      {active ? `Open for ${formatDuration(ended - started)}` : formatDuration(ended - started)}
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
        rowsPerPageOptions={alertPageSizeOptions}
        onPageChange={(_, page) => props.onPageChange(page + 1)}
        onRowsPerPageChange={(event) => props.onPageSizeChange(Number(event.target.value))}
      />
    </Box>
  )
}
