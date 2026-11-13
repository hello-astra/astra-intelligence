/**
 * Small colour toolkit used to derive theme palettes.
 *
 * Works in OKLCH (perceptual lightness / chroma / hue) so that "make this colour
 * lighter for a dark background" keeps the hue and saturation the eye expects.
 * Output is always sRGB hex, so values can be used in CSS, SVG attributes and
 * concatenated with hex alpha suffixes.
 */

export interface Oklch {
  /** Lightness 0..1 */
  l: number
  /** Chroma 0..~0.37 */
  c: number
  /** Hue in degrees */
  h: number
}

type Rgb = [number, number, number]

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function hexToRgb(hex: string): Rgb {
  let h = hex.replace('#', '')
  if (h.length === 3) h = [...h].map((x) => x + x).join('')
  const n = Number.parseInt(h.slice(0, 6), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb.map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('')}`
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const h = (Math.atan2(B, A) * 180) / Math.PI
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h }
}

function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

const inGamut = (rgb: Rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005)

/** OKLCH → hex, reducing chroma (keeping lightness and hue) when the colour is outside sRGB. */
export function oklchToHex(color: Oklch): string {
  const l = clamp(color.l, 0, 1)
  let rgb = oklchToLinear({ ...color, l })
  if (!inGamut(rgb)) {
    let lo = 0
    let hi = color.c
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(oklchToLinear({ l, c: mid, h: color.h }))) lo = mid
      else hi = mid
    }
    rgb = oklchToLinear({ l, c: lo, h: color.h })
  }
  return rgbToHex(rgb.map((v) => toGamma(clamp(v, 0, 1))) as Rgb)
}

/** Returns the colour with its OKLCH lightness clamped into [min, max]. */
export function clampLightness(hex: string, min: number, max: number): string {
  const c = hexToOklch(hex)
  const l = clamp(c.l, min, max)
  return l === c.l ? hex : oklchToHex({ ...c, l })
}

export function adjust(hex: string, change: Partial<Oklch> & { dl?: number; cMul?: number }): string {
  const c = hexToOklch(hex)
  return oklchToHex({
    l: change.l ?? c.l + (change.dl ?? 0),
    c: (change.c ?? c.c) * (change.cMul ?? 1),
    h: change.h ?? c.h,
  })
}

/** Linear interpolation in OKLab between two colours (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const ca = hexToOklch(a)
  const cb = hexToOklch(b)
  const ax = ca.c * Math.cos((ca.h * Math.PI) / 180)
  const ay = ca.c * Math.sin((ca.h * Math.PI) / 180)
  const bx = cb.c * Math.cos((cb.h * Math.PI) / 180)
  const by = cb.c * Math.sin((cb.h * Math.PI) / 180)
  const x = ax + (bx - ax) * t
  const y = ay + (by - ay) * t
  const h = (Math.atan2(y, x) * 180) / Math.PI
  return oklchToHex({ l: ca.l + (cb.l - ca.l) * t, c: Math.hypot(x, y), h: h < 0 ? h + 360 : h })
}

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.x contrast ratio (1..21). */
export function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Smallest angular distance between two hues, in degrees. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** `rgb(r g b / a)` for use where a translucent variant of a hex colour is needed. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex).map((v) => Math.round(v * 255))
  return `rgb(${r} ${g} ${b} / ${alpha})`
}
