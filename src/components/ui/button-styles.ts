import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'ghost' | 'outline' | 'danger'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,box-shadow,opacity] duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-astra-cyan ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-strong text-white hover:bg-[#3369eb] ' +
    'shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_0_1px_rgb(79_134_255/0.45),0_10px_30px_-12px_rgb(79_134_255/0.7)] ' +
    'hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_0_0_1px_rgb(120_160_255/0.6),0_14px_36px_-12px_rgb(79_134_255/0.9)]',
  secondary: 'bg-white/[0.06] text-fg ring-1 ring-inset ring-white/10 hover:bg-white/[0.1] hover:ring-white/[0.16]',
  glass: 'glass text-fg hover:bg-white/[0.08]',
  ghost: 'text-fg-2 hover:bg-white/[0.06] hover:text-fg',
  outline: 'text-fg ring-1 ring-inset ring-line-strong hover:bg-white/[0.04] hover:ring-fg-4',
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
    'hover:bg-white/[0.06] hover:text-fg focus-visible:outline-2 focus-visible:outline-astra-cyan',
    'disabled:pointer-events-none disabled:opacity-40',
    className,
  )
