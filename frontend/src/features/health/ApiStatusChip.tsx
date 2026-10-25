import CircleIcon from '@mui/icons-material/Circle'
import Box from '@mui/material/Box'
import Chip, { type ChipProps } from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import type { ReactNode } from 'react'
import type { HealthStatus } from './healthApi'
import { useApiHealth } from './useApiHealth'

const statusView: Record<HealthStatus, { label: string; color: ChipProps['color'] }> = {
  Healthy: { label: 'API healthy', color: 'success' },
  Degraded: { label: 'API degraded', color: 'warning' },
  Unhealthy: { label: 'API unhealthy', color: 'error' },
}

/** Header indicator for backend availability, with per-check details in the tooltip. */
export function ApiStatusChip() {
  const { data, error, isPending } = useApiHealth()

  let label: string
  let color: ChipProps['color']
  let details: ReactNode

  if (isPending) {
    label = 'Checking API'
    color = 'default'
    details = 'Checking whether the API is reachable...'
  } else if (error) {
    label = 'API unreachable'
    color = 'error'
    details = error.message
  } else {
    ;({ label, color } = statusView[data.status])
    details = data.checks.map((check) => (
      <Box key={check.name}>
        {check.name}: {check.status}
        {check.description ? ` - ${check.description}` : ''}
      </Box>
    ))
  }

  return (
    <Tooltip title={details}>
      <Chip
        size="small"
        variant="outlined"
        color={color}
        icon={<CircleIcon sx={{ fontSize: 10 }} />}
        label={label}
        // role="status" makes screen readers announce changes, e.g. healthy -> unreachable.
        role="status"
        aria-label={label}
        sx={{
          mr: 1,
          // Phones: show only the colored dot.
          '& .MuiChip-label': { display: { xs: 'none', sm: 'block' } },
          '& .MuiChip-icon': { mr: { xs: '-6px', sm: 0 } },
        }}
      />
    </Tooltip>
  )
}
