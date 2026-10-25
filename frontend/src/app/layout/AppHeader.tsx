import MenuIcon from '@mui/icons-material/Menu'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { ApiStatusChip } from '../../features/health/ApiStatusChip'
import { UserMenu } from '../../features/auth/UserMenu'
import { OnlineUsers } from '../../features/realtime/OnlineUsers'
import { ThemeModeMenu } from './ThemeModeMenu'

type AppHeaderProps = {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        // Above the permanent drawer, so the drawer starts below the header.
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          aria-label="Open navigation"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Box
          component={RouterLink}
          to="/"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', textDecoration: 'none' }}
        >
          <MonitorHeartIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            PulseMonitor
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <OnlineUsers />
        <ApiStatusChip />
        <ThemeModeMenu />
        <UserMenu />
      </Toolbar>
    </AppBar>
  )
}
