import LogoutIcon from '@mui/icons-material/Logout'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useNotify } from '../../components/notifications/notificationContext'
import { useAuth } from './authStore'
import { signOut } from './session'

/** Avatar button in the header with the signed-in user's details and Sign out. */
export function UserMenu() {
  const { user } = useAuth()
  const notify = useNotify()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  if (!user) return null

  const handleSignOut = async () => {
    setAnchor(null)
    try {
      await signOut()
    } catch {
      // signOut() always ends the local session; the API call failing doesn't matter to the user.
    }
    // RequireAuth sends the user to the login page once the session is gone.
    notify('You have been signed out.', 'info')
  }

  return (
    <>
      <Tooltip title={user.userName}>
        <IconButton
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-controls={anchor ? 'user-menu' : undefined}
          aria-expanded={anchor ? 'true' : undefined}
          sx={{ ml: 0.5 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {user.userName.slice(0, 2).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        id="user-menu"
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 500 }}>{user.userName}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {user.email}
          </Typography>
          {user.roles.map((role) => (
            <Chip key={role} label={role} size="small" color={role === 'Admin' ? 'primary' : 'default'} sx={{ mr: 0.5 }} />
          ))}
        </Box>
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  )
}
