import { startTransition, useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useColorMode } from '@/theme/color-mode'
import { DEMO_THEME_PRESETS } from '@/theme/demo-presets'
import { resolveDemoTheme } from '@/theme/demo-theme-engine'
import { ThemeScopeContext, type ThemeScope } from '@/theme/theme-scope'
import type { DemoId } from '@/types/content'
import { cn } from '@/utils/cn'
import { buildChartTheme } from './chartTheme'
import { DemoThemeContext } from './demo-theme'

const storageKey = (demoId: DemoId) => `astra:theme:demo:${demoId}`

function readPreset(demoId: DemoId): string | null {
  try {
    return localStorage.getItem(storageKey(demoId))
  } catch {
    return null
  }
}

/**
 * Gives a demo its own product identity. The selected template (persisted per demo)
 * and the site-wide light/dark mode resolve to a palette that is written as CSS
 * variables on the demo root — every token-based utility inside re-themes — and
 * exposed to charts through useChartTheme().
 */
export function DemoThemeProvider({ demoId, children, className }: { demoId: DemoId; children: ReactNode; className?: string }) {
  const { mode } = useColorMode()
  const presets = DEMO_THEME_PRESETS[demoId]
  const [presetId, setPresetId] = useState(() => readPreset(demoId))
  const preset = presets.find((p) => p.id === presetId) ?? presets[0]
  const theme = useMemo(() => resolveDemoTheme(preset, mode), [preset, mode])
  const chart = useMemo(() => buildChartTheme(theme), [theme])

  const setPreset = useCallback(
    (id: string) => {
      // Re-theming re-renders every chart; as a transition the menu closes instantly.
      startTransition(() => setPresetId(id))
      try {
        localStorage.setItem(storageKey(demoId), id)
      } catch {
        /* storage unavailable — the choice lasts for this visit */
      }
    },
    [demoId],
  )

  // When a new palette commits, skip per-element colour transitions for a frame: hundreds of
  // elements easing their colours at once is expensive on slow devices.
  const firstRender = useRef(true)
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const root = document.documentElement
    root.classList.add('theme-switching')
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
    return () => {
      cancelAnimationFrame(frame)
      root.classList.remove('theme-switching')
    }
  }, [preset.id])

  const value = useMemo(() => ({ demoId, presets, preset, setPreset, theme, chart }), [demoId, presets, preset, setPreset, theme, chart])
  const scope = useMemo<ThemeScope>(() => ({ theme: mode, style: theme.vars as CSSProperties }), [mode, theme])

  return (
    <DemoThemeContext.Provider value={value}>
      <ThemeScopeContext.Provider value={scope}>
        <div data-theme={mode} data-demo-theme={preset.id} style={scope.style} className={cn('text-fg', className)}>
          {children}
        </div>
      </ThemeScopeContext.Provider>
    </DemoThemeContext.Provider>
  )
}
