import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

type StatTileProps = {
  /** Sentence case, no trailing colon. */
  label: string
  value: string
  /** Supporting line under the value, e.g. "Peak 95% in the last 24 hours". */
  caption?: string
}

/** A single current value. The number is the chart, so no plot here. */
export function StatTile({ label, value, caption }: StatTileProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="h4" component="p" sx={{ fontWeight: 600, my: 0.5 }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {caption}
        </Typography>
      )}
    </Paper>
  )
}
