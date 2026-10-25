import { createTheme } from '@mui/material/styles'

// Teal brand color, matching the favicon.
const brand = {
  main: '#0f766e',
  light: '#14b8a6',
  dark: '#115e59',
}

declare module '@mui/material/styles' {
  interface Palette {
    chart: ChartPalette
  }
  interface PaletteOptions {
    chart?: ChartPalette
  }
}

/**
 * Data-visualization colors, one set per color scheme. Taken from the reference
 * categorical palette (slot 1, blue) and its sequential ramp; validated against the
 * card surfaces (#ffffff light, #121212 dark): lightness band, chroma and >= 3:1 contrast.
 */
type ChartPalette = {
  /** Single-series line/area and meter fill. */
  series: string
  /** Unfilled part of a meter: a lighter (light mode) or darker (dark mode) step of the same ramp. */
  track: string
}

export const theme = createTheme({
  // CSS variables let light/dark switch without re-rendering the React tree.
  cssVariables: {
    colorSchemeSelector: 'data',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: brand,
        background: { default: '#f6f8f8' },
        chart: { series: '#2a78d6', track: '#cde2fb' },
      },
    },
    dark: {
      palette: {
        primary: { main: brand.light, light: '#5eead4', dark: brand.main },
        chart: { series: '#3987e5', track: '#104281' },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'Roboto, system-ui, "Segoe UI", sans-serif',
  },
})
