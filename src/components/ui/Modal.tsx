import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'center' | 'drawer'
  /** Optional element shown to the left of the title (icon, badge). */
  leading?: ReactNode
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Stack of open modal ids so only the top-most modal reacts to Escape / Tab.
const modalStack: string[] = []

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  variant = 'center',
  leading,
}: ModalProps) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    modalStack.push(id)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current
      // Never pull focus back if the user has already moved into the dialog.
      if (!panel || panel.contains(document.activeElement)) return
      const preferred = panel.querySelector<HTMLElement>('[data-autofocus]')
      const firstField = panel.querySelector<HTMLElement>('input:not([disabled]), select, textarea')
      ;(preferred ?? firstField ?? panel).focus()
    }, 40)

    const onKey = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== id) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key === 'Tab' && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null,
        )
        if (nodes.length === 0) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      const index = modalStack.lastIndexOf(id)
      if (index >= 0) modalStack.splice(index, 1)
      if (modalStack.length === 0) document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, id])

  const isDrawer = variant === 'drawer'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-[90] flex', isDrawer ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6')}>
          <motion.div
            className="absolute inset-0 bg-[#02040a]/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onCloseRef.current()}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            aria-describedby={description ? `${id}-desc` : undefined}
            tabIndex={-1}
            className={cn(
              'relative flex w-full flex-col overflow-hidden border border-line-strong bg-[#0b1122] shadow-2xl shadow-black/60 outline-none',
              isDrawer
                ? 'h-full max-w-xl border-y-0 border-r-0'
                : cn('max-h-[92dvh] rounded-t-2xl sm:rounded-2xl', sizes[size]),
            )}
            initial={isDrawer ? { x: 40, opacity: 0 } : { y: 24, opacity: 0, scale: 0.98 }}
            animate={isDrawer ? { x: 0, opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
            exit={isDrawer ? { x: 40, opacity: 0 } : { y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          >
            <header className="flex items-start gap-3 border-b border-line px-5 py-4">
              {leading}
              <div className="min-w-0 flex-1">
                <h2 id={`${id}-title`} className="text-base font-semibold text-fg">
                  {title}
                </h2>
                {description && (
                  <p id={`${id}-desc`} className="mt-0.5 text-[13px] text-fg-3">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onCloseRef.current()}
                className="-mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-white/[0.06] hover:text-fg"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-white/[0.015] px-5 py-3">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
