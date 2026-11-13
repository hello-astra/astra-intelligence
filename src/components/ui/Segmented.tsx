import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  icon?: LucideIcon
  disabled?: boolean
  title?: string
}

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  ariaLabel: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
  fullWidth?: boolean
}

/** Single-select segmented control (radiogroup semantics with arrow-key support). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'sm',
  className,
  fullWidth,
}: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)
    const pos = enabled.indexOf(index)
    let next = pos
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (pos - 1 + enabled.length) % enabled.length
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (pos + 1) % enabled.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = enabled.length - 1
    const target = enabled[next]
    onChange(options[target].value)
    refs.current[target]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-ink/[0.04] p-0.5 ring-1 ring-ink/[0.07] ring-inset scrollbar-none',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {options.map((option, index) => {
        const active = option.value === value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            disabled={option.disabled}
            title={option.title}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
              size === 'xs' && 'h-6 px-2 text-[11px]',
              size === 'sm' && 'h-7 px-2.5 text-xs',
              size === 'md' && 'h-8 px-3 text-[13px]',
              fullWidth && 'flex-1',
              active
                ? 'bg-ink/[0.1] text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]'
                : 'text-fg-3 hover:bg-ink/[0.04] hover:text-fg-2',
              option.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
