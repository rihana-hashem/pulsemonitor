import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

type PagePlaceholderProps = {
  title: string
  description: string
}

/** Temporary page body until the real page is built. */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <Box component="section">
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary' }}>{description}</Typography>
    </Box>
  )
}
