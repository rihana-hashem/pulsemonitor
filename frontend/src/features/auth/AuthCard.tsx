import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

type AuthCardProps = {
  title: string
  subtitle: string
  children: ReactNode
}

/** Centered card used by the sign-in and sign-up pages. */
export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2, bgcolor: 'background.default' }}>
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 } }}>
        <Stack spacing={1} sx={{ alignItems: 'center', mb: 3, textAlign: 'center' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <MonitorHeartIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" component="span" sx={{ fontWeight: 600 }}>
              PulseMonitor
            </Typography>
          </Stack>
          <Typography variant="h6" component="h1">
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        </Stack>
        {children}
      </Paper>
    </Box>
  )
}
