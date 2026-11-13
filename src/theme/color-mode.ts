import { createContext, useContext } from 'react'

export type ColorMode = 'light' | 'dark'

/** localStorage key — also read by the inline script in index.html before first paint. */
export const COLOR_MODE_KEY = 'astra:theme'

/** Browser UI colour (address bar, PWA title bar) per mode. Matches --color-canvas. */
export const THEME_COLOR: Record<ColorMode, string> = { dark: '#05070e', light: '#f4f6fb' }

export interface ColorModeContextValue {
  mode: ColorMode
  setMode: (mode: ColorMode) => void
  toggle: () => void
}

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'dark',
  setMode: () => {},
  toggle: () => {},
})

export function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext)
}

/** The mode the inline bootstrap script applied to <html> (dark when unset). */
export function readDocumentMode(): ColorMode {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}
