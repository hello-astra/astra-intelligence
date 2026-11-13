import { createContext, useContext, type CSSProperties } from 'react'

/**
 * The colour scope an element is rendered in. Portalled UI (modals) renders outside
 * the demo root in the DOM, so it re-applies the scope to stay in the product's palette.
 */
export interface ThemeScope {
  theme?: 'light' | 'dark'
  style?: CSSProperties
}

export const ThemeScopeContext = createContext<ThemeScope>({})

export function useThemeScope(): ThemeScope {
  return useContext(ThemeScopeContext)
}
