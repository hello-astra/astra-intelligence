import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'blue' | 'violet' | 'cyan' | 'green' | 'amber' | 'red' | 'orange' | 'pink'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-white/[0.05] text-fg-2 ring-white/10',
  blue: 'bg-[#4f86ff]/10 text-brand-soft ring-[#4f86ff]/25',
  violet: 'bg-[#8b74ff]/10 text-astra-violet-soft ring-[#8b74ff]/25',
  cyan: 'bg-[#22d3ee]/10 text-astra-cyan-soft ring-[#22d3ee]/20',
  green: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
  red: 'bg-red-500/10 text-red-300 ring-red-500/25',
  orange: 'bg-orange-500/10 text-orange-300 ring-orange-500/25',
  pink: 'bg-pink-500/10 text-pink-300 ring-pink-500/25',
}

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-fg-3',
  blue: 'bg-brand',
  violet: 'bg-astra-violet',
  cyan: 'bg-astra-cyan',
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  pink: 'bg-pink-400',
}

interface BadgeProps {
  tone?: BadgeTone
  dot?: boolean
  icon?: ReactNode
  size?: 'xs' | 'sm'
  className?: string
  children: ReactNode
  title?: string
}

export function Badge({ tone = 'neutral', dot, icon, size = 'sm', className, children, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ring-1 ring-inset',
        size === 'xs' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-[11px]',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dots[tone])} aria-hidden />}
      {icon}
      {children}
    </span>
  )
}
