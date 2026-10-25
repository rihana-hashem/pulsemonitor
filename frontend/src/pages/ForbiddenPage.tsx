import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'

// Not lazy-loaded: rendered by RequireRole, which already lives in the main bundle.
export default function ForbiddenPage() {
  return (
    <Box component="section" sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        403
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        You don't have permission to view this page.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/">
        Back to dashboard
      </Button>
    </Box>
  )
}
