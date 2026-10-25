import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined'
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import Chip, { type ChipProps } from '@mui/material/Chip'
import type { ReactElement } from 'react'
import type { ServerHealth } from './serverHealth'

const healthView: Record<ServerHealth, { label: string; color: ChipProps['color']; icon: ReactElement }> = {
  healthy: { label: 'Healthy', color: 'success', icon: <CheckCircleOutlinedIcon /> },
  alerting: { label: 'Alerting', color: 'error', icon: <WarningAmberIcon /> },
  stale: { label: 'Stale', color: 'warning', icon: <HistoryToggleOffIcon /> },
  noData: { label: 'No data', color: 'default', icon: <HelpOutlineIcon /> },
  paused: { label: 'Paused', color: 'default', icon: <PauseCircleOutlineIcon /> },
}

/** Server state: status color always paired with an icon and a label. */
export function HealthChip({ health, count }: { health: ServerHealth; count?: number }) {
  const { label, color, icon } = healthView[health]
  const text = health === 'alerting' && count ? `${label} · ${count}` : label

  return <Chip size="small" variant="outlined" color={color} icon={icon} label={text} />
}
