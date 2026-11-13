import { useId, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}

/** CSS-only tooltip shown on hover and keyboard focus of the wrapped element. */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const id = useId()
  return (
    <span className={cn('group/tip relative inline-flex', className)} aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 w-max max-w-[260px] -translate-x-1/2 rounded-lg border border-line-strong bg-popover px-2.5 py-1.5 text-xs leading-relaxed font-normal text-fg-2 normal-case opacity-0 shadow-xl shadow-black/40 transition-opacity duration-150',
          'group-focus-within/tip:opacity-100 group-hover/tip:opacity-100',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {content}
      </span>
    </span>
  )
}
