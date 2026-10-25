import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { chartsAxisHighlightClasses } from '@mui/x-charts/ChartsAxisHighlight'
import { LineChart, lineClasses } from '@mui/x-charts/LineChart'
import type { Series } from './chartData'
import { formatFullTime, formatMetric, formatTick, type MetricUnit } from './formatters'
import type { MetricPoint } from './types'

type MetricChartProps = {
  title: string
  unit: MetricUnit
  series: Series
  average: (point: MetricPoint) => number
  peak: (point: MetricPoint) => number
  /** The full requested range, so missing data shows as empty space rather than a shorter axis. */
  from: Date
  to: Date
  rangeMinutes: number
  bucketMinutes: number
  /** A newer range is loading: the current chart stays visible, dimmed. */
  refreshing: boolean
}

// Theme variable (see theme.ts), so the line follows the light/dark color scheme.
const seriesColor = 'var(--mui-palette-chart-series)'

/** One metric over time: a single 2px line on a 10% area wash, with a crosshair tooltip. */
export function MetricChart(props: MetricChartProps) {
  const { title, unit, series, average, peak } = props

  const values = series.points.map((point) => (point ? average(point) : null))
  // A point with gaps on both sides has no neighbor to draw a line to; show it as a marker
  // so the data does not silently disappear.
  const isIsolated = (index: number) =>
    values[index] !== null && (values[index - 1] ?? null) === null && (values[index + 1] ?? null) === null
  const bucketLabel = props.bucketMinutes === 1 ? 'minute' : `${props.bucketMinutes} minutes`

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, opacity: props.refreshing ? 0.6 : 1, transition: 'opacity 150ms' }}
    >
      {/* Single series: the title names it, so no legend. */}
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Average per {bucketLabel}; hover for the peak
      </Typography>
      <LineChart
        height={220}
        hideLegend
        skipAnimation
        grid={{ horizontal: true }}
        xAxis={[
          {
            data: series.x,
            scaleType: 'time',
            min: props.from,
            max: props.to,
            tickNumber: 5,
            valueFormatter: (date: Date, context) =>
              context.location === 'tick' ? formatTick(date, props.rangeMinutes) : formatFullTime(date),
          },
        ]}
        yAxis={[
          {
            min: 0,
            // Percentages always use the full scale, so charts are comparable.
            max: unit === 'percent' ? 100 : undefined,
            width: 56,
            valueFormatter: (value: number) => formatMetric(value, unit),
          },
        ]}
        series={[
          {
            data: values,
            label: title,
            color: seriesColor,
            area: true,
            showMark: ({ index }) => isIsolated(index),
            connectNulls: false,
            curve: 'linear',
            valueFormatter: (value, { dataIndex }) => {
              const point = series.points[dataIndex]
              if (value === null || !point) return 'No data'
              return `${formatMetric(value, unit)} avg · ${formatMetric(peak(point), unit)} peak`
            },
          },
        ]}
        sx={{
          [`& .${lineClasses.line}`]: { strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' },
          // A wash, never a saturated block.
          [`& .${lineClasses.area}`]: { fillOpacity: 0.1 },
          // Crosshair as a solid hairline; dashes would read as a threshold.
          [`& .${chartsAxisHighlightClasses.root}`]: { strokeDasharray: 'none', strokeWidth: 1 },
          // Isolated points: >= 8px, filled, with a 2px surface ring.
          [`& .${lineClasses.mark}`]: {
            fill: seriesColor,
            stroke: 'var(--mui-palette-background-paper)',
            strokeWidth: 2,
            r: 5,
          },
        }}
      />
    </Paper>
  )
}
