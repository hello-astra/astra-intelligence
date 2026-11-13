import { cn } from '@/utils/cn'

export type MeterTone = 'brand' | 'good' | 'warning' | 'critical' | 'violet' | 'cyan' | 'auto'

// Fill + a translucent step of the same colour for the track (state reads across the whole bar).
// Colours are theme variables, so meters follow each product palette and light/dark mode.
const tone = (color: string, track = 16) => ({ fill: color, track: `color-mix(in oklab, ${color} ${track}%, transparent)` })
const toneMap: Record<Exclude<MeterTone, 'auto'>, { fill: string; track: string }> = {
  brand: tone('var(--color-series-1)'),
  good: tone('var(--color-good)', 18),
  warning: tone('var(--color-warning)'),
  critical: tone('var(--color-critical)', 20),
  violet: tone('var(--color-astra-violet)', 18),
  cyan: tone('var(--color-astra-cyan)', 14),
}

interface MeterProps {
  value: number
  max?: number
  tone?: MeterTone
  size?: 'xs' | 'sm' | 'md'
  label?: string
  className?: string
  /** For tone="auto": ratio at which the meter turns warning / critical. */
  thresholds?: [number, number]
}

export function Meter({ value, max = 100, tone = 'brand', size = 'sm', label, className, thresholds = [0.75, 0.9] }: MeterProps) {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max))
  const resolved: Exclude<MeterTone, 'auto'> =
    tone === 'auto' ? (ratio >= thresholds[1] ? 'critical' : ratio >= thresholds[0] ? 'warning' : 'brand') : tone
  const colors = toneMap[resolved]
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn(
        'w-full overflow-hidden rounded-full',
        size === 'xs' && 'h-1',
        size === 'sm' && 'h-1.5',
        size === 'md' && 'h-2',
        className,
      )}
      style={{ backgroundColor: colors.track }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${ratio * 100}%`, backgroundColor: colors.fill }}
      />
    </div>
  )
}

export interface SegmentPart {
  label: string
  value: number
  color: string
}

/** Thin segmented bar (part-to-whole beside its figures). 2px surface gaps, rounded ends, no text. */
export function SegmentedBar({ parts, className, height = 8 }: { parts: SegmentPart[]; className?: string; height?: number }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0)
  return (
    <div
      className={cn('flex w-full gap-[2px] overflow-hidden rounded-full', className)}
      style={{ height }}
      role="img"
      aria-label={parts
        .map((p) => `${p.label} ${total > 0 ? Math.round((p.value / total) * 100) : 0}%`)
        .join(', ')}
    >
      {parts
        .filter((p) => p.value > 0)
        .map((p) => (
          <div
            key={p.label}
            className="h-full transition-[flex-grow] duration-500 first:rounded-l-full last:rounded-r-full"
            style={{ flexGrow: p.value, flexBasis: 0, backgroundColor: p.color }}
            title={`${p.label}: ${total > 0 ? ((p.value / total) * 100).toFixed(1) : 0}%`}
          />
        ))}
    </div>
  )
}
