import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatMegabytes, formatMetric } from './formatters'
import type { DiskUsage } from './types'

type DiskUsageListProps = {
  disks: DiskUsage[]
}

/** One meter per drive: fill and track are two steps of the same ramp. */
export function DiskUsageList({ disks }: DiskUsageListProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 500, mb: 1.5 }}>
        Disks
      </Typography>
      {disks.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No disks are monitored on this server.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {disks.map((disk) => (
            <Box key={disk.diskId}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {disk.driveLetter}
                </Typography>
                <Typography variant="body2">{formatMetric(disk.usedPercentage, 'percent')} used</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={disk.usedPercentage}
                aria-label={`${disk.driveLetter} ${formatMetric(disk.usedPercentage, 'percent')} used`}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  bgcolor: 'chart.track',
                  '& .MuiLinearProgress-bar': { bgcolor: 'chart.series', borderRadius: 1 },
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatMegabytes(disk.freeSpaceMB)} free of {formatMegabytes(disk.totalSpaceMB)}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
