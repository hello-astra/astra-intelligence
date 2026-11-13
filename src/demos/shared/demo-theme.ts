import { createContext, useContext } from 'react'
import type { DemoThemePreset } from '@/theme/demo-presets'
import type { ResolvedDemoTheme } from '@/theme/demo-theme-engine'
import type { DemoId } from '@/types/content'
import { buildChartTheme, type ChartTheme } from './chartTheme'

export interface DemoThemeContextValue {
  demoId: DemoId
  presets: readonly DemoThemePreset[]
  preset: DemoThemePreset
  setPreset: (id: string) => void
  theme: ResolvedDemoTheme
  chart: ChartTheme
}

export const DemoThemeContext = createContext<DemoThemeContextValue | null>(null)

/** The current demo's theme (null outside a demo). Provided by <DemoThemeProvider/>. */
export function useDemoTheme(): DemoThemeContextValue | null {
  return useContext(DemoThemeContext)
}

const FALLBACK_CHART = buildChartTheme(null)

/**
 * Chart colours and Recharts prop presets for the current demo theme.
 * Outside a demo it returns the corporate palette.
 */
export function useChartTheme(): ChartTheme {
  return useContext(DemoThemeContext)?.chart ?? FALLBACK_CHART
}
