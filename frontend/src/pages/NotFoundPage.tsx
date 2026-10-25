import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'

export default function NotFoundPage() {
  return (
    <Box component="section" sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        404
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        This page does not exist.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/">
        Back to dashboard
      </Button>
    </Box>
  )
}
