import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Reveal } from './Reveal'

interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
  actions?: ReactNode
  /** Heading level for document outline (default h2). */
  as?: 'h1' | 'h2'
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.2em] text-astra-cyan-soft/90 uppercase', className)}>
      <span className="h-px w-6 bg-gradient-to-r from-transparent to-astra-cyan/70" aria-hidden />
      {children}
    </span>
  )
}

export function SectionHeading({ eyebrow, title, description, align = 'left', className, actions, as: Tag = 'h2' }: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <Reveal className={cn('flex flex-col gap-4', centered && 'items-center text-center', className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className={cn('flex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between', centered && 'md:flex-col md:items-center')}>
        <div className={cn('max-w-3xl', centered && 'mx-auto')}>
          <Tag className="text-3xl leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-fg sm:text-4xl lg:text-[44px]">
            {title}
          </Tag>
          {description && <p className="mt-4 text-base leading-relaxed text-pretty text-fg-2 sm:text-lg">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>
    </Reveal>
  )
}
