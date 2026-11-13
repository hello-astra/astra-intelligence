import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** Milliseconds before auto-dismiss (default 4200). */
  duration?: number
}

export type ToastFn = (options: ToastOptions) => void

export const ToastContext = createContext<ToastFn | null>(null)

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
