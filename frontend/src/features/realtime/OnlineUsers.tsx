import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import { useAuth } from '../auth/authStore'
import { useConnectionStatus } from './connection'
import { useOnlineUsers } from './presence'

/** Who else is looking at PulseMonitor right now (live user presence). */
export function OnlineUsers() {
  const status = useConnectionStatus()
  const users = useOnlineUsers()
  const { user: me } = useAuth()

  // While offline the list would be stale, so show nothing rather than wrong data.
  if (status !== 'connected' || users.length === 0) return null

  const names = users.map((u) => (u.userId === me?.userId ? `${u.userName} (you)` : u.userName))

  return (
    <Tooltip title={<Box sx={{ whiteSpace: 'pre-line' }}>{`Online now:\n${names.join('\n')}`}</Box>}>
      <AvatarGroup
        max={4}
        aria-label={`${users.length} ${users.length === 1 ? 'user' : 'users'} online: ${names.join(', ')}`}
        sx={{
          display: { xs: 'none', sm: 'flex' },
          mr: 1,
          '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 },
        }}
      >
        {users.map((u) => (
          <Avatar key={u.userId} alt={u.userName} sx={{ bgcolor: u.userId === me?.userId ? 'primary.main' : 'grey.500' }}>
            {u.userName.slice(0, 2).toUpperCase()}
          </Avatar>
        ))}
      </AvatarGroup>
    </Tooltip>
  )
}
