/**
 * Chart tokens shared by every demo.
 *
 * SERIES is a categorical palette validated for color-vision deficiency
 * against the panel surface (#0a0f1d): all adjacent pairs clear ΔE ≥ 8
 * (OKLab ×100) under protan/deutan simulation and ≥ 15 for normal vision;
 * the first three slots also pass the all-pairs test. Assign slots in order —
 * never cycle or generate extra hues (fold extras into "Other").
 */
export const SERIES = ['#4180f2', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'] as const

/** De-emphasis grey for context series ("everything else"). */
export const DEEMPH = '#5b6886'

/** Status colors carry meaning (good → critical) and always ship with an icon + label. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const

export const CHART = {
  surface: '#0a0f1d',
  grid: '#18223a',
  axis: '#26314d',
  tick: '#8090ad',
  text: '#a5b3cc',
} as const

/** Props for <XAxis/> and <YAxis/>: hairline axis, no tick marks, muted labels. */
export const axisProps = {
  tick: { fill: CHART.tick, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART.axis },
} as const

export const yAxisProps = {
  tick: { fill: CHART.tick, fontSize: 11 },
  tickLine: false,
  axisLine: false,
  width: 56,
} as const

/** Solid hairline grid, horizontal only. */
export const gridProps = {
  stroke: CHART.grid,
  vertical: false,
} as const

/** Active dot with a surface ring so it stays legible on crossing lines. */
export const activeDot = { r: 4, strokeWidth: 2, stroke: CHART.surface } as const

export const barCursor = { fill: 'rgb(255 255 255 / 0.035)' } as const
export const lineCursor = { stroke: CHART.axis, strokeWidth: 1 } as const

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
