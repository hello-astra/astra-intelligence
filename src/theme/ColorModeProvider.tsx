import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { COLOR_MODE_KEY, ColorModeContext, THEME_COLOR, readDocumentMode, type ColorMode } from './color-mode'

function applyToDocument(mode: ColorMode) {
  const root = document.documentElement
  root.dataset.theme = mode
  root.style.colorScheme = mode
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[mode])
}

/**
 * Site-wide light/dark mode. The initial value comes from <html data-theme>, which an
 * inline script sets from localStorage before the first paint, so React never renders
 * the wrong theme and there is no flash on load.
 */
export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(readDocumentMode)

  const setMode = useCallback((next: ColorMode) => {
    const root = document.documentElement
    const commit = () => {
      // One frame without colour transitions: hundreds of elements easing at once is janky on slow GPUs.
      root.classList.add('theme-switching')
      applyToDocument(next)
      flushSync(() => setModeState(next))
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
    }
    try {
      localStorage.setItem(COLOR_MODE_KEY, next)
    } catch {
      /* storage unavailable — the choice lasts for this page view */
    }
    const canCrossFade =
      'startViewTransition' in document &&
      !root.classList.contains('lite') &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (canCrossFade) document.startViewTransition(commit)
    else commit()
  }, [])

  // Keep tabs in sync when the preference changes elsewhere.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== COLOR_MODE_KEY) return
      const next: ColorMode = event.newValue === 'light' ? 'light' : 'dark'
      applyToDocument(next)
      setModeState(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => ({ mode, setMode, toggle: () => setMode(mode === 'dark' ? 'light' : 'dark') }), [mode, setMode])

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
}
