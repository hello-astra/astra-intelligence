import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import { cn } from '@/utils/cn'
import { formatSignedPercent } from '@/utils/format'

interface StatTileProps {
  label: string
  value: ReactNode
  icon?: LucideIcon
  /** Percentage change vs. a named period. */
  delta?: number | null
  deltaLabel?: string
  /** 'percent' renders +4.2%; 'points' renders +1.3 pts (for rates such as margin). */
  deltaUnit?: 'percent' | 'points'
  /** Whether an increase is good (revenue) or bad (costs, churn). */
  goodWhen?: 'up' | 'down'
  hint?: ReactNode
  trend?: number[]
  trendColor?: string
  className?: string
  onClick?: () => void
  active?: boolean
}

/** KPI tile: label · value (proportional figures) · signed delta · optional sparkline. */
export function StatTile({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel = 'vs previous period',
  deltaUnit = 'percent',
  goodWhen = 'up',
  hint,
  trend,
  trendColor = '#4180f2',
  className,
  onClick,
  active,
}: StatTileProps) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta)
  const flat = hasDelta && Math.abs(delta) < 0.05
  const good = hasDelta && !flat && (goodWhen === 'up' ? delta > 0 : delta < 0)
  const DeltaIcon = !hasDelta || flat ? Minus : delta > 0 ? TrendingUp : TrendingDown
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? Boolean(active) : undefined}
      className={cn(
        'flex min-w-0 flex-col rounded-xl border bg-panel p-3.5 text-left transition-colors',
        active ? 'border-brand/60 ring-1 ring-brand/30' : 'border-line',
        onClick && 'hover:border-line-strong',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-fg-3">{label}</span>
        {Icon && <Icon className="size-4 shrink-0 text-fg-4" aria-hidden />}
      </div>
      {/* Narrow tiles (two-up on phones) stack the sparkline under the value so the figure is never cut off. */}
      <div className="@container mt-1.5">
        <div className="flex flex-col gap-1.5 @min-[12.5rem]:flex-row @min-[12.5rem]:items-end @min-[12.5rem]:justify-between @min-[12.5rem]:gap-2">
          <span className="truncate text-xl font-semibold tracking-tight text-fg">{value}</span>
          {trend && trend.length > 1 && <Sparkline data={trend} width={72} height={26} color={trendColor} className="shrink-0" />}
        </div>
      </div>
      {hasDelta ? (
        <span className="mt-1 flex items-center gap-1 text-[11px]">
          <span className={cn('inline-flex items-center gap-0.5 font-medium', flat ? 'text-fg-3' : good ? 'text-emerald-300' : 'text-red-300')}>
            <DeltaIcon className="size-3" aria-hidden />
            {deltaUnit === 'points' ? `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta).toFixed(1)} pts` : formatSignedPercent(delta)}
          </span>
          <span className="truncate text-fg-4">{deltaLabel}</span>
        </span>
      ) : hint ? (
        <span className="mt-1 truncate text-[11px] text-fg-3">{hint}</span>
      ) : null}
    </Tag>
  )
}
