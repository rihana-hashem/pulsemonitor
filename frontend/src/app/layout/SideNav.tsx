import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { NavLink } from 'react-router'
import { useIsAdmin } from '../../features/auth/authStore'
import { navItems } from '../navigation'

type SideNavProps = {
  /** Called after a link is chosen, e.g. to close the mobile drawer. */
  onNavigate?: () => void
}

export function SideNav({ onNavigate }: SideNavProps) {
  const isAdmin = useIsAdmin()
  const items = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <List component="nav" aria-label="Main navigation" sx={{ px: 1 }}>
      {items.map((item) => (
        <ListItemButton
          key={item.path}
          component={NavLink}
          to={item.path}
          // "/" would otherwise match every route.
          end={item.path === '/'}
          onClick={onNavigate}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            // NavLink adds the "active" class (and aria-current="page") to the current route.
            '&.active': {
              bgcolor: 'action.selected',
              color: 'primary.main',
              '& .MuiListItemIcon-root': { color: 'primary.main' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  )
}
