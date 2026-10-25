import AssessmentIcon from '@mui/icons-material/Assessment'
import DashboardIcon from '@mui/icons-material/Dashboard'
import DnsIcon from '@mui/icons-material/Dns'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import PeopleIcon from '@mui/icons-material/People'
import WorkHistoryIcon from '@mui/icons-material/WorkHistory'
import type { ReactElement } from 'react'

export type NavItem = {
  label: string
  path: string
  icon: ReactElement
  /** Hidden from non-admins. The route is also guarded, and the API enforces it too. */
  adminOnly?: boolean
}

/** Sidebar entries, in display order. Paths must match the routes in router.tsx. */
export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Servers', path: '/servers', icon: <DnsIcon /> },
  { label: 'Alerts', path: '/alerts', icon: <NotificationsActiveIcon /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { label: 'Background jobs', path: '/jobs', icon: <WorkHistoryIcon /> },
  { label: 'Users', path: '/users', icon: <PeopleIcon />, adminOnly: true },
]
