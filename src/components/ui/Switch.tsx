import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** Visually hide the label (it remains the accessible name). */
  hideLabel?: boolean
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md'
}

export function Switch({ checked, onChange, label, hideLabel, disabled, className, size = 'md' }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('group inline-flex items-center gap-2 text-sm text-fg-2 disabled:opacity-50', className)}
    >
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors',
          size === 'sm' ? 'h-4 w-7' : 'h-5 w-9',
          checked ? 'bg-brand-strong' : 'bg-ink/[0.12]',
        )}
      >
        <span
          className={cn(
            'absolute rounded-full bg-white shadow transition-transform',
            size === 'sm' ? 'left-0.5 size-3' : 'left-0.5 size-4',
            checked && (size === 'sm' ? 'translate-x-3' : 'translate-x-4'),
          )}
        />
      </span>
      {!hideLabel && <span>{label}</span>}
    </button>
  )
}
