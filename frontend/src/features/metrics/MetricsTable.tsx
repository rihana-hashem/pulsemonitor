import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { parseApiDate } from '../../utils/format'
import { formatFullTime, formatMetric } from './formatters'
import type { MetricPoint } from './types'

type MetricsTableProps = {
  points: MetricPoint[]
}

const pair = (avg: number, max: number, unit: 'percent' | 'ms') =>
  `${formatMetric(avg, unit)} / ${formatMetric(max, unit)}`

/** The charts' data as a table: every value readable without hovering. Newest first. */
export function MetricsTable({ points }: MetricsTableProps) {
  const rows = [...points].reverse()

  return (
    <Paper variant="outlined">
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table size="small" stickyHeader aria-label="Metric history" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell align="right">CPU avg / peak</TableCell>
              <TableCell align="right">Memory avg / peak</TableCell>
              <TableCell align="right">Disk avg / peak</TableCell>
              <TableCell align="right">Response time avg / peak</TableCell>
              <TableCell align="right">Samples</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                    No metrics in this time range.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((point) => (
                <TableRow key={point.timestamp}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatFullTime(parseApiDate(point.timestamp))}</TableCell>
                  <TableCell align="right">{pair(point.cpuAvg, point.cpuMax, 'percent')}</TableCell>
                  <TableCell align="right">{pair(point.memoryAvg, point.memoryMax, 'percent')}</TableCell>
                  <TableCell align="right">{pair(point.diskAvg, point.diskMax, 'percent')}</TableCell>
                  <TableCell align="right">{pair(point.responseTimeAvg, point.responseTimeMax, 'ms')}</TableCell>
                  <TableCell align="right">{point.samples}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
