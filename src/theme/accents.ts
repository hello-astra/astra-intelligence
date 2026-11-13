import type { CSSProperties } from 'react'
import type { DemoId } from '@/types/content'
import { clampLightness } from './color'
import { DEFAULT_PRESET } from './demo-presets'

/**
 * Marketing-site colours for a solution, derived from its product's default theme
 * preset so the website and the demo always share one identity.
 */
export interface SolutionAccents {
  /** Vivid primary for icons, glows and swatches on dark surfaces. */
  accent: string
  /** Secondary identity colour. */
  accent2: string
  /** Light tint of the primary for text on dark surfaces. */
  accentSoft: string
  /** Deep shade of the primary for text and icons on light surfaces. */
  accentInk: string
}

export function solutionAccents(demoId: DemoId): SolutionAccents {
  const p = DEFAULT_PRESET(demoId)
  return {
    accent: clampLightness(p.primary, 0.6, 0.86),
    accent2: clampLightness(p.secondary, 0.62, 0.88),
    accentSoft: clampLightness(p.primary, 0.78, 0.9),
    accentInk: clampLightness(p.primary, 0.34, 0.5),
  }
}

/**
 * CSS variables for the `text-sol` / `text-sol-accent` utilities, which pick the right
 * shade for the current light/dark mode.
 */
export function accentVars(a: SolutionAccents): CSSProperties {
  return {
    '--sol': a.accentSoft,
    '--sol-ink': a.accentInk,
    '--sol-accent': a.accent,
    '--sol-accent-ink': a.accentInk,
    '--p': a.accent,
    '--p2': a.accent2,
  } as CSSProperties
}
