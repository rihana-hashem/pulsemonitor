import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

/** Shown while a lazily loaded page's code is downloading. */
export function PageLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <CircularProgress aria-label="Loading page" />
    </Box>
  )
}
