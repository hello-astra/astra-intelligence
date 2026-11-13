import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ToastContext, type ToastOptions, type ToastTone } from './toast-context'

interface ToastItem extends ToastOptions {
  id: number
}

const toneStyles: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-emerald-300' },
  info: { icon: Info, className: 'text-brand-soft' },
  warning: { icon: AlertTriangle, className: 'text-amber-300' },
  error: { icon: XCircle, className: 'text-red-300' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (options: ToastOptions) => {
      counter.current += 1
      const id = counter.current
      setToasts((list) => [...list.slice(-3), { ...options, id }])
      window.setTimeout(() => dismiss(id), options.duration ?? 4200)
    },
    [dismiss],
  )

  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed top-16 left-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 sm:top-auto sm:bottom-0 sm:p-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const tone = toneStyles[t.tone ?? 'success']
            const Icon = tone.icon
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="glass-strong pointer-events-auto flex items-start gap-3 rounded-xl p-3.5 shadow-2xl shadow-black/50"
                role="status"
              >
                <Icon className={cn('mt-0.5 size-[18px] shrink-0', tone.className)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-fg">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs leading-relaxed text-fg-3">{t.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="-mt-0.5 -mr-1 inline-flex size-6 items-center justify-center rounded-md text-fg-3 hover:bg-white/[0.08] hover:text-fg"
                  aria-label="Dismiss notification"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
