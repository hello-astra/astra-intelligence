import type { ResolvedDemoTheme } from '@/theme/demo-theme-engine'

/**
 * Chart tokens. Every demo chart reads its colours from the active product theme via
 * `useChartTheme()` (see ./demo-theme.tsx), so series, axes, grid lines and tooltips
 * follow the product palette and light/dark mode automatically.
 *
 * SERIES is categorical: the product's primary colour first, then hues kept ≥ 24°
 * apart. Assign slots in order — never cycle or generate extra hues (fold extras
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

// Corporate palette, used outside a product theme (validated for colour-vision deficiency on #0a0f1d).
const CORPORATE = {
  series: ['#4180f2', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  deemph: '#5b6886',
  status: { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' },
  surface: '#0a0f1d',
  grid: '#18223a',
  axis: '#26314d',
  tick: '#8090ad',
  text: '#a5b3cc',
  ramp: ['#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#86b6ef'],
  rampText: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#0b0b0b', '#0b0b0b', '#0b0b0b'],
  cursor: 'rgb(255 255 255 / 0.035)',
}

function chartAnimationAllowed(): boolean {
  if (typeof window === 'undefined') return false
  return !document.documentElement.classList.contains('lite') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function buildChartTheme(theme: ResolvedDemoTheme | null): ChartTheme {
  const c = theme?.chart ?? CORPORATE
  return {
    SERIES: c.series,
    DEEMPH: c.deemph,
    STATUS: c.status,
    CHART: { surface: c.surface, grid: c.grid, axis: c.axis, tick: c.tick, text: c.text },
    RAMP: c.ramp,
    RAMP_TEXT: c.rampText,
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
