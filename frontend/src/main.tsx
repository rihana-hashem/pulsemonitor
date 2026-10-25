import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { queryClient } from './api/queryClient'
import { router } from './app/router'
import { theme } from './app/theme'
import { NotificationProvider } from './components/notifications/NotificationProvider'
import { installAuthInterceptors } from './features/auth/interceptors'
import { restoreSession } from './features/auth/session'
import { startRealtime } from './features/realtime/connection'
import { startPresence } from './features/realtime/presence'

installAuthInterceptors()
// Starts before the first render; route guards show a loader until it settles.
void restoreSession()
// SignalR follows the signed-in state: connects after sign-in, disconnects on sign-out.
startPresence()
startRealtime()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {/* Browser style reset; enableColorScheme also themes scrollbars and form controls. */}
        <CssBaseline enableColorScheme />
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </ThemeProvider>
      {/* Development only; the package renders nothing in production builds. */}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  </StrictMode>,
)
