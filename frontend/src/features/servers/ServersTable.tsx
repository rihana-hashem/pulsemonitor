import CircleIcon from '@mui/icons-material/Circle'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
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
import type { SortDirection } from '../../api/types'
import { formatDateTime } from '../../utils/format'
import type { Server, ServerSortField } from './types'
import { pageSizeOptions } from './useServerListParams'

type ServersTableProps = {
  servers: Server[]
  totalCount: number
  /** 1-based, as used by the API. */
  page: number
  pageSize: number
  sortBy: ServerSortField
  sortDirection: SortDirection
  /** True while a newer page is loading; the current rows stay visible. */
  refreshing: boolean
  emptyMessage: string
  onSortChange: (field: ServerSortField) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onOpen: (server: Server) => void
  /** Omit onEdit and onDelete to hide the Actions column (read-only users). */
  onEdit?: (server: Server) => void
  onDelete?: (server: Server) => void
}

// Columns hidden on phones to keep the table readable.
const hideOnPhone = { display: { xs: 'none', md: 'table-cell' } }

// Invisible on screen, still read by screen readers.
const srOnly = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

export function ServersTable(props: ServersTableProps) {
  const { servers, sortBy, sortDirection, onSortChange, onEdit, onDelete } = props
  const showActions = onEdit !== undefined && onDelete !== undefined

  const sortableHeader = (field: ServerSortField, label: string) => (
    <TableSortLabel
      active={sortBy === field}
      direction={sortBy === field ? sortDirection : 'asc'}
      onClick={() => onSortChange(field)}
    >
      {label}
    </TableSortLabel>
  )

  return (
    <Box>
      {/* Fixed height so the table does not jump when the bar appears. */}
      <Box sx={{ height: 4 }}>{props.refreshing && <LinearProgress />}</Box>
      <TableContainer>
        <Table
          aria-label="Servers"
          // Tighter cells on phones so all visible columns fit without sideways scrolling.
          sx={{ '& .MuiTableCell-root': { px: { xs: 0.75, sm: 2 } } }}
        >
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortBy === 'name' ? sortDirection : false}>
                {sortableHeader('name', 'Name')}
              </TableCell>
              <TableCell sortDirection={sortBy === 'ipAddress' ? sortDirection : false}>
                {sortableHeader('ipAddress', 'IP address')}
              </TableCell>
              <TableCell sx={hideOnPhone}>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell
                sx={hideOnPhone}
                sortDirection={sortBy === 'createdAt' ? sortDirection : false}
              >
                {sortableHeader('createdAt', 'Created')}
              </TableCell>
              {showActions && (
                <TableCell align="right">
                  {/* Phones: hidden visually (the icons are self-explanatory) but kept for screen readers. */}
                  <Box component="span" sx={{ '@media (max-width: 599.95px)': srOnly }}>
                    Actions
                  </Box>
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {servers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 6 : 5}>
                  <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    {props.emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              servers.map((server) => (
                <TableRow
                  key={server.serverId}
                  hover
                  onClick={() => props.onOpen(server)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{server.serverName}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{server.ipAddress}</TableCell>
                  <TableCell sx={{ ...hideOnPhone, color: 'text.secondary', maxWidth: 280 }}>
                    <Typography variant="body2" noWrap title={server.description ?? undefined}>
                      {server.description ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={server.isActive ? 'Monitored' : 'Paused'}>
                      <Chip
                        size="small"
                        icon={<CircleIcon sx={{ fontSize: 10 }} />}
                        label={server.isActive ? 'Monitored' : 'Paused'}
                        aria-label={server.isActive ? 'Monitored' : 'Paused'}
                        color={server.isActive ? 'success' : 'default'}
                        variant="outlined"
                        sx={{
                          // Phones: only the colored dot, to keep the row narrow.
                          '& .MuiChip-label': { display: { xs: 'none', sm: 'block' } },
                          '& .MuiChip-icon': { mr: { xs: '-6px', sm: 0 } },
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ ...hideOnPhone, whiteSpace: 'nowrap' }}>
                    {formatDateTime(server.createdAt)}
                  </TableCell>
                  {showActions && (
                    // Buttons stop propagation so they don't also open the row.
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          aria-label={`Edit ${server.serverName}`}
                          onClick={() => onEdit(server)}
                        >
                          <EditOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          aria-label={`Delete ${server.serverName}`}
                          color="error"
                          onClick={() => onDelete(server)}
                        >
                          <DeleteOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={props.totalCount}
        // MUI pages are 0-based; the API's are 1-based.
        page={props.totalCount === 0 ? 0 : props.page - 1}
        rowsPerPage={props.pageSize}
        rowsPerPageOptions={pageSizeOptions}
        onPageChange={(_, page) => props.onPageChange(page + 1)}
        onRowsPerPageChange={(event) => props.onPageSizeChange(Number(event.target.value))}
      />
    </Box>
  )
}
