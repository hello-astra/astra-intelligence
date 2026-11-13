import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PanelProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Remove body padding (for edge-to-edge tables). */
  flush?: boolean
  as?: 'section' | 'div' | 'article'
}

/** Standard surface used throughout the demos and website. */
export function Panel({ title, description, actions, children, className, bodyClassName, flush, as: Tag = 'section' }: PanelProps) {
  const hasHeader = Boolean(title || actions)
  return (
    <Tag className={cn('min-w-0 rounded-xl border border-line bg-panel', className)}>
      {hasHeader && (
        <header className={cn('flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-3.5', flush ? 'pb-3' : 'pb-1')}>
          <div className="min-w-0">
            {title && <h3 className="text-[13px] font-semibold text-fg">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-fg-3">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && 'p-4', !flush && hasHeader && 'pt-3', bodyClassName)}>{children}</div>
    </Tag>
  )
}
