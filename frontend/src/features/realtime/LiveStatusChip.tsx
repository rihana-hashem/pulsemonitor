import CircleIcon from '@mui/icons-material/Circle'
import Chip, { type ChipProps } from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { useConnectionStatus } from './connection'
import type { ConnectionStatus } from './types'

const view: Record<ConnectionStatus, { label: string; color: ChipProps['color']; help: string }> = {
  connected: { label: 'Live', color: 'success', help: 'New readings appear as soon as they are collected.' },
  connecting: { label: 'Connecting', color: 'default', help: 'Connecting to live updates...' },
  reconnecting: { label: 'Reconnecting', color: 'warning', help: 'Live updates were interrupted; reconnecting. Data refreshes every minute meanwhile.' },
  disconnected: { label: 'Offline', color: 'default', help: 'Live updates are unavailable; data refreshes every minute.' },
}

/** State of the SignalR connection, as a label (never color alone). */
export function LiveStatusChip() {
  const status = useConnectionStatus()
  const { label, color, help } = view[status]

  return (
    <Tooltip title={help}>
      <Chip
        size="small"
        variant="outlined"
        color={color}
        icon={<CircleIcon sx={{ fontSize: 10 }} />}
        label={label}
        role="status"
        aria-label={`Live updates: ${label}`}
      />
    </Tooltip>
  )
}
