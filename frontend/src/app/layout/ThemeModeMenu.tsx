import CheckIcon from '@mui/icons-material/Check'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useColorScheme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import { useState, type ReactElement } from 'react'

type Mode = 'light' | 'dark' | 'system'

const modes: { value: Mode; label: string; icon: ReactElement }[] = [
  { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
  { value: 'system', label: 'System', icon: <SettingsBrightnessIcon fontSize="small" /> },
]

/** Light / dark / follow-the-OS switch. MUI persists the choice in localStorage. */
export function ThemeModeMenu() {
  const { mode, setMode } = useColorScheme()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  // mode is undefined until MUI has read the stored preference.
  const current = modes.find((m) => m.value === mode) ?? modes[2]

  const choose = (value: Mode) => {
    setMode(value)
    setAnchor(null)
  }

  return (
    <>
      <Tooltip title={`Theme: ${current.label}`}>
        <IconButton
          color="inherit"
          aria-label="Change theme"
          aria-haspopup="menu"
          aria-controls={anchor ? 'theme-mode-menu' : undefined}
          aria-expanded={anchor ? 'true' : undefined}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          {current.icon}
        </IconButton>
      </Tooltip>
      <Menu
        id="theme-mode-menu"
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {modes.map((m) => (
          <MenuItem key={m.value} selected={m.value === mode} onClick={() => choose(m.value)}>
            <ListItemIcon>{m.icon}</ListItemIcon>
            <ListItemText>{m.label}</ListItemText>
            {m.value === mode && <CheckIcon fontSize="small" sx={{ ml: 2 }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
