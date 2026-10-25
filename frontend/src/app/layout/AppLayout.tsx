import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Drawer from '@mui/material/Drawer'
import Toolbar from '@mui/material/Toolbar'
import { useState } from 'react'
import { Outlet } from 'react-router'
import { useAlertNotifications } from '../../features/realtime/useAlertNotifications'
import { AppHeader } from './AppHeader'
import { SideNav } from './SideNav'

const drawerWidth = 240

/**
 * App shell: fixed header, sidebar and page content.
 * From md up the sidebar is permanent; below that it is a drawer opened from the header.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  // Alert notifications on every signed-in page.
  useAlertNotifications()
  const closeMobile = () => setMobileOpen(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppHeader onMenuClick={() => setMobileOpen(true)} />

      <Box component="aside" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile and tablet. keepMounted keeps it fast to open. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth },
          }}
        >
          <Toolbar />
          <SideNav onNavigate={closeMobile} />
        </Drawer>

        {/* Desktop. */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {/* Spacer so the list starts below the fixed header. */}
          <Toolbar />
          <SideNav />
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
