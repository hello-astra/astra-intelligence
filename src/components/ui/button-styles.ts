import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'ghost' | 'outline' | 'danger'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,box-shadow,opacity] duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-astra-cyan ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  // Text colour comes from the theme: white on deep primaries, dark on light ones (amber, mint, sky).
  primary: 'bg-brand-strong text-on-brand hover:bg-brand-hover shadow-(--shadow-brand) hover:shadow-(--shadow-brand-hover)',
  secondary: 'bg-ink/[0.06] text-fg ring-1 ring-inset ring-ink/10 hover:bg-ink/[0.1] hover:ring-ink/[0.16]',
  glass: 'glass text-fg hover:bg-ink/[0.08]',
  ghost: 'text-fg-2 hover:bg-ink/[0.06] hover:text-fg',
  outline: 'text-fg ring-1 ring-inset ring-line-strong hover:bg-ink/[0.04] hover:ring-fg-4',
  danger: 'bg-[#b42d2d] text-white hover:bg-[#c23434] shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 gap-1.5 rounded-md px-2.5 text-xs',
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[15px]',
}

export function buttonStyles(options: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  const { variant = 'primary', size = 'md', className } = options
  return cn(base, variants[variant], sizes[size], className)
}

export const iconButtonStyles = (className?: string) =>
  cn(
    'inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-3 transition-colors',
    'hover:bg-ink/[0.06] hover:text-fg focus-visible:outline-2 focus-visible:outline-astra-cyan',
    'disabled:pointer-events-none disabled:opacity-40',
    className,
  )
