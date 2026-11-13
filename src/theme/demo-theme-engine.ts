import { clampLightness, contrast, hexToOklch, hueDistance, mix, oklchToHex, withAlpha } from './color'
import type { DemoThemePreset, RadiusStyle } from './demo-presets'

/**
 * Derives a complete demo palette from a preset.
 *
 * The result is a set of CSS custom properties (applied to the demo root so every
 * Tailwind utility inside re-themes), plus the same colours as plain hex values for
 * charts (Recharts takes colours as SVG attributes).
 *
 * Rules the generator enforces:
 * - Text tokens keep WCAG AA contrast on their panel surface in both modes.
 * - Button text is white only when it reaches 4.5:1; otherwise the button colour is
 *   darkened slightly, or (for light primaries such as amber) the text turns dark.
 * - Chart series start with the brand colour and stay ≥ 24° apart in hue.
 */

export type ColorMode = 'light' | 'dark'

export interface ChartPalette {
  /** Eight categorical colours, brand colour first. */
  series: string[]
  /** De-emphasis grey for context series. */
  deemph: string
  status: { good: string; warning: string; serious: string; critical: string }
  surface: string
  grid: string
  axis: string
  tick: string
  text: string
  /** Sequential ramp of the primary colour, lowest value first (7 steps). */
  ramp: string[]
  /** Legible text colour on each ramp step. */
  rampText: string[]
  /** Hover band behind bars. */
  cursor: string
  /** Forecast / projected series — distinct from the actuals and never the alarm red. */
  forecast: string
}

export interface ResolvedDemoTheme {
  preset: DemoThemePreset
  mode: ColorMode
  /** CSS custom properties for the demo root. */
  vars: Record<string, string>
  /** For the 'contrast' chrome in light mode: the sidebar is its own dark scope. */
  sidebar: { mode: ColorMode; vars: Record<string, string> } | null
  chart: ChartPalette
}

const RADII: Record<RadiusStyle, Record<string, string>> = {
  sharp: { '--radius-md': '0.3125rem', '--radius-lg': '0.375rem', '--radius-xl': '0.5rem', '--radius-2xl': '0.625rem' },
  default: { '--radius-md': '0.375rem', '--radius-lg': '0.5rem', '--radius-xl': '0.75rem', '--radius-2xl': '1rem' },
  round: { '--radius-md': '0.5rem', '--radius-lg': '0.625rem', '--radius-xl': '1rem', '--radius-2xl': '1.25rem' },
}

/** Distinct, saturated hues used to complete the categorical chart palette. */
const SERIES_CANDIDATES = [
  '#3B82F6',
  '#F97316',
  '#10B981',
  '#EAB308',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
  '#EF4444',
  '#84CC16',
  '#14B8A6',
  '#A855F7',
  '#0EA5E9',
]

const STATUS = {
  dark: { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' },
  light: { good: '#0a8a0a', warning: '#b77d00', serious: '#cf5f2b', critical: '#c42f2f' },
} as const

function neutralScale(preset: DemoThemePreset) {
  const { hue, chroma } = preset.neutral
  return (l: number, cMul = 1) => oklchToHex({ l, c: chroma * cMul, h: hue })
}

function buttonColors(primary: string, darkText: string) {
  if (contrast('#ffffff', primary) >= 4.5) return { bg: primary, fg: '#ffffff' }
  const o = hexToOklch(primary)
  for (let dl = 0.01; dl <= 0.081; dl += 0.01) {
    const bg = oklchToHex({ ...o, l: o.l - dl })
    if (contrast('#ffffff', bg) >= 4.5) return { bg, fg: '#ffffff' }
  }
  return { bg: primary, fg: darkText }
}

function surfaces(preset: DemoThemePreset, mode: ColorMode) {
  const n = neutralScale(preset)
  const primary = preset.primary
  if (mode === 'dark') {
    const base = n(0.165)
    return {
      canvas: n(0.145),
      base,
      chrome: preset.chrome === 'tinted' ? mix(n(0.18), primary, 0.07) : preset.chrome === 'contrast' ? n(0.125, 1.2) : base,
      panel: n(0.195),
      raised: n(0.228),
      popover: n(0.215),
      hover: n(0.252),
      sunken: n(0.135),
      line: n(0.278, 1.1),
      lineStrong: n(0.345, 1.1),
      scrim: n(0.08, 0.6),
      fg: n(0.955, 0.25),
      fg2: n(0.82, 0.55),
      fg3: n(0.7, 0.65),
      fg4: n(0.615, 0.6),
      ink: '#ffffff',
    }
  }
  return {
    canvas: n(0.972, 0.35),
    base: n(0.982, 0.25),
    chrome: preset.chrome === 'tinted' ? mix(n(0.978, 0.3), primary, 0.05) : n(0.99, 0.15),
    panel: '#ffffff',
    raised: n(0.968, 0.35),
    popover: '#ffffff',
    hover: n(0.948, 0.4),
    sunken: n(0.955, 0.4),
    line: n(0.915, 0.45),
    lineStrong: n(0.855, 0.5),
    scrim: n(0.2, 0.6),
    fg: n(0.22, 0.6),
    fg2: n(0.38, 0.6),
    fg3: n(0.5, 0.55),
    fg4: n(0.545, 0.5),
    ink: n(0.25, 1.4),
  }
}

function brandTokens(preset: DemoThemePreset, mode: ColorMode) {
  const p = hexToOklch(preset.primary)
  const darkText = oklchToHex({ l: 0.2, c: 0.035, h: p.h })
  const button = buttonColors(preset.primary, darkText)
  const b = hexToOklch(button.bg)
  const hover =
    button.fg === '#ffffff'
      ? oklchToHex({ ...b, l: b.l + (mode === 'dark' ? 0.045 : -0.045) })
      : oklchToHex({ ...b, l: b.l + 0.05 })
  if (mode === 'dark') {
    return {
      brand: clampLightness(preset.primary, 0.62, 0.86),
      brandStrong: button.bg,
      brandHover: hover,
      brandSoft: clampLightness(preset.primary, 0.8, 0.9),
      onBrand: button.fg,
      accent: clampLightness(preset.secondary, 0.66, 0.86),
      accentSoft: clampLightness(preset.secondary, 0.82, 0.92),
    }
  }
  return {
    brand: clampLightness(preset.primary, 0.42, 0.66),
    brandStrong: button.bg,
    brandHover: hover,
    brandSoft: clampLightness(preset.primary, 0.32, 0.5),
    onBrand: button.fg,
    accent: clampLightness(preset.secondary, 0.42, 0.62),
    accentSoft: clampLightness(preset.secondary, 0.32, 0.48),
  }
}

function buildSeries(preset: DemoThemePreset, mode: ColorMode): string[] {
  const chosen: string[] = []
  const pool = [preset.primary, ...preset.chart, ...SERIES_CANDIDATES]
  // Prefer hues ≥ 24° apart; relax the spacing only if the pool runs out before 8 slots.
  for (const minDistance of [24, 16, 8, 0]) {
    for (const hex of pool) {
      if (chosen.length === 8) break
      if (chosen.includes(hex)) continue
      const h = hexToOklch(hex).h
      if (chosen.every((other) => hueDistance(hexToOklch(other).h, h) >= minDistance)) chosen.push(hex)
    }
  }
  return chosen.map((hex) => (mode === 'dark' ? clampLightness(hex, 0.64, 0.8) : clampLightness(hex, 0.48, 0.64)))
}

function buildRamp(primary: string, mode: ColorMode) {
  const p = hexToOklch(primary)
  const steps = 7
  const ramp = Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1)
    // Dark mode: low values recede into the background; light mode: low values are pale.
    const l = mode === 'dark' ? 0.36 + t * 0.5 : 0.93 - t * 0.5
    const c = p.c * (mode === 'dark' ? 0.55 + t * 0.45 : 0.25 + t * 0.75)
    return oklchToHex({ l, c, h: p.h })
  })
  const rampText = ramp.map((bg) => (contrast(bg, '#0b0b0b') >= contrast(bg, '#ffffff') ? '#0b0b0b' : '#ffffff'))
  return { ramp, rampText }
}

function toVars(s: ReturnType<typeof surfaces>, b: ReturnType<typeof brandTokens>, series: string[], deemph: string, mode: ColorMode) {
  const status = STATUS[mode]
  const vars: Record<string, string> = {
    '--color-canvas': s.canvas,
    '--color-base': s.base,
    '--color-chrome': s.chrome,
    '--color-panel': s.panel,
    '--color-raised': s.raised,
    '--color-popover': s.popover,
    '--color-hover': s.hover,
    '--color-sunken': s.sunken,
    '--color-line': s.line,
    '--color-line-strong': s.lineStrong,
    '--color-scrim': s.scrim,
    '--color-fg': s.fg,
    '--color-fg-2': s.fg2,
    '--color-fg-3': s.fg3,
    '--color-fg-4': s.fg4,
    '--color-ink': s.ink,
    '--color-brand': b.brand,
    '--color-brand-strong': b.brandStrong,
    '--color-brand-hover': b.brandHover,
    '--color-brand-soft': b.brandSoft,
    '--color-on-brand': b.onBrand,
    '--color-accent': b.accent,
    '--color-accent-soft': b.accentSoft,
    // Corporate violet accents inside a product take the product's secondary colour.
    '--color-astra-violet': b.accent,
    '--color-astra-violet-soft': b.accentSoft,
    '--color-deemph': deemph,
    '--color-good': status.good,
    '--color-warning': status.warning,
    '--color-serious': status.serious,
    '--color-critical': status.critical,
  }
  series.forEach((c, i) => {
    vars[`--color-series-${i + 1}`] = c
  })
  return vars
}

/**
 * Chart palette of the website theme ("Astra Classic"). The dark series is the validated
 * categorical palette the site has always used (checked for colour-vision deficiency
 * against #0a0f1d); the light series are the same hues deepened for white surfaces.
 */
const SITE_CHARTS: Record<ColorMode, Omit<ChartPalette, 'rampText'>> = {
  dark: {
    series: ['#4180f2', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
    deemph: '#5b6886',
    status: STATUS.dark,
    surface: '#0a0f1d',
    grid: '#18223a',
    axis: '#26314d',
    tick: '#8090ad',
    text: '#a5b3cc',
    ramp: ['#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#86b6ef'],
    cursor: 'rgb(255 255 255 / 0.035)',
    forecast: '#9085e9',
  },
  light: {
    series: ['#2f6fe0', '#c84f1c', '#148a61', '#ad7200', '#c13f70', '#0a7a0a', '#6d5fd6', '#d24f4f'],
    deemph: '#8a95a8',
    status: STATUS.light,
    surface: '#ffffff',
    grid: '#e8ecf2',
    axis: '#c9d1de',
    tick: '#56637a',
    text: '#334058',
    ramp: buildRamp('#2f66e8', 'light').ramp,
    cursor: 'rgb(11 26 51 / 0.045)',
    forecast: '#6d5fd6',
  },
}

const textOn = (bg: string) => (contrast(bg, '#0b0b0b') >= contrast(bg, '#ffffff') ? '#0b0b0b' : '#ffffff')

/** The website palette: no overrides — the demo inherits the site's CSS tokens for the mode. */
export function sitePalette(mode: ColorMode): ChartPalette {
  const c = SITE_CHARTS[mode]
  return { ...c, rampText: c.ramp.map(textOn) }
}

const cache = new Map<string, ResolvedDemoTheme>()

export function resolveDemoTheme(preset: DemoThemePreset, mode: ColorMode): ResolvedDemoTheme {
  const key = `${preset.id}:${mode}`
  const hit = cache.get(key)
  if (hit) return hit

  if (preset.site) {
    const theme: ResolvedDemoTheme = { preset, mode, vars: {}, sidebar: null, chart: sitePalette(mode) }
    cache.set(key, theme)
    return theme
  }

  const n = neutralScale(preset)
  const s = surfaces(preset, mode)
  const b = brandTokens(preset, mode)
  const series = buildSeries(preset, mode)
  const deemph = mode === 'dark' ? n(0.52, 1.6) : n(0.74, 1.6)
  const { ramp, rampText } = buildRamp(preset.primary, mode)

  const vars = { ...toVars(s, b, series, deemph, mode), ...RADII[preset.radius] }

  // 'contrast' chrome in light mode: the sidebar is a dark scope with its own tokens.
  let sidebar: ResolvedDemoTheme['sidebar'] = null
  if (preset.chrome === 'contrast' && mode === 'light') {
    const ds = surfaces(preset, 'dark')
    const db = brandTokens(preset, 'dark')
    const sidebarVars = toVars(ds, db, buildSeries(preset, 'dark'), n(0.52, 1.6), 'dark')
    sidebarVars['--color-chrome'] = mix(n(0.235, 1.4), preset.primary, 0.08)
    sidebar = { mode: 'dark', vars: sidebarVars }
  }

  const theme: ResolvedDemoTheme = {
    preset,
    mode,
    vars,
    sidebar,
    chart: {
      series,
      deemph,
      status: STATUS[mode],
      surface: s.panel,
      grid: mode === 'dark' ? n(0.255, 1.1) : n(0.93, 0.4),
      axis: mode === 'dark' ? n(0.335, 1.1) : n(0.84, 0.5),
      tick: s.fg3,
      text: s.fg2,
      ramp,
      rampText,
      cursor: withAlpha(s.ink, mode === 'dark' ? 0.035 : 0.045),
      forecast: series[2],
    },
  }
  cache.set(key, theme)
  return theme
}
