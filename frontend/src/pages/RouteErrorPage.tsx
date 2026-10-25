import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { isRouteErrorResponse, useRouteError } from 'react-router'

/**
 * Rendered by the router when a route throws (render error, failed lazy import, ...).
 * Not lazy-loaded, so it still works when loading a page chunk is what failed.
 */
export function RouteErrorPage() {
  const error = useRouteError()

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong'

  return (
    <Box sx={{ p: 4, maxWidth: 640, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        The page could not be displayed. Try reloading; if it keeps happening, the app may have been
        updated since you opened it.
      </Typography>
      {import.meta.env.DEV && error instanceof Error && (
        <Box
          component="pre"
          sx={{ textAlign: 'left', overflow: 'auto', p: 2, mb: 3, bgcolor: 'action.hover', borderRadius: 1 }}
        >
          {error.stack ?? error.message}
        </Box>
      )}
      <Button variant="contained" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </Box>
  )
}
