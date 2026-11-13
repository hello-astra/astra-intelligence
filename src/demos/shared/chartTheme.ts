import { sitePalette, type ResolvedDemoTheme } from '@/theme/demo-theme-engine'

/**
 * Chart tokens. Every demo chart reads its colours from the active product theme via
 * `useChartTheme()` (see ./demo-theme.ts), so series, axes, grid lines and tooltips
 * follow the product palette and light/dark mode automatically.
 *
 * SERIES is categorical: the product's primary colour first, then hues kept ≥ 24°
 * apart (the "Astra Classic" website theme uses the site's validated palette). Assign slots in order — never cycle or generate extra hues (fold extras
 * into "Other"). STATUS colours carry meaning (good → critical) and always ship
 * with an icon + label.
 */
export interface ChartTheme {
  SERIES: readonly string[]
  /** De-emphasis grey for context series ("everything else"). */
  DEEMPH: string
  STATUS: { good: string; warning: string; serious: string; critical: string }
  CHART: { surface: string; grid: string; axis: string; tick: string; text: string }
  /** Sequential ramp of the primary colour (lowest value first) and legible text on each step. */
  RAMP: readonly string[]
  RAMP_TEXT: readonly string[]
  /** Colour for forecasts / projections. */
  FORECAST: string
  /** Props for <XAxis/>: hairline axis, no tick marks, muted labels. */
  axisProps: { tick: { fill: string; fontSize: number }; tickLine: false; axisLine: { stroke: string } }
  /** Props for <YAxis/>. */
  yAxisProps: { tick: { fill: string; fontSize: number }; tickLine: false; axisLine: false; width: number }
  /** Solid hairline grid, horizontal only. */
  gridProps: { stroke: string; vertical: false }
  /** Active dot with a surface ring so it stays legible on crossing lines. */
  activeDot: { r: number; strokeWidth: number; stroke: string }
  barCursor: { fill: string }
  lineCursor: { stroke: string; strokeWidth: number }
  /** Recharts entry animations: off on low-power devices and for reduced motion. */
  animate: boolean
}

// Outside a demo, charts use the website palette (dark).
const SITE_DARK = sitePalette('dark')

function chartAnimationAllowed(): boolean {
  if (typeof window === 'undefined') return false
  return !document.documentElement.classList.contains('lite') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function buildChartTheme(theme: ResolvedDemoTheme | null): ChartTheme {
  const c = theme?.chart ?? SITE_DARK
  return {
    SERIES: c.series,
    DEEMPH: c.deemph,
    STATUS: c.status,
    CHART: { surface: c.surface, grid: c.grid, axis: c.axis, tick: c.tick, text: c.text },
    RAMP: c.ramp,
    RAMP_TEXT: c.rampText,
    FORECAST: c.forecast,
    axisProps: { tick: { fill: c.tick, fontSize: 11 }, tickLine: false, axisLine: { stroke: c.axis } },
    yAxisProps: { tick: { fill: c.tick, fontSize: 11 }, tickLine: false, axisLine: false, width: 56 },
    gridProps: { stroke: c.grid, vertical: false },
    activeDot: { r: 4, strokeWidth: 2, stroke: c.surface },
    barCursor: { fill: c.cursor },
    lineCursor: { stroke: c.axis, strokeWidth: 1 },
    animate: chartAnimationAllowed(),
  }
}

/** Max bar thickness (thin marks, let the band's leftover be air). */
export const BAR_SIZE = 24

/** Rounds an axis maximum up to a clean 1 / 2 / 2.5 / 5 × 10ⁿ value so ticks land on round numbers. */
export function niceMax(value: number): number {
  if (value <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(value)))
  const f = value / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * exp
}
