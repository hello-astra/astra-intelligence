import { createContext, useContext } from 'react'
import type { LucideIcon } from 'lucide-react'

export type DemoVariant = 'embedded' | 'full'

export const DemoFrameContext = createContext<{ variant: DemoVariant }>({ variant: 'full' })

export function useDemoFrame() {
  return useContext(DemoFrameContext)
}

export interface DemoView<V extends string = string> {
  id: V
  label: string
  icon: LucideIcon
  /** Small counter shown next to the label (e.g. pending orders). */
  badge?: string | number
}
