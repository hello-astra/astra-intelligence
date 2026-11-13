import { cn } from '@/utils/cn'

export type ControlSize = 'sm' | 'md' | 'lg'

const controlSizes: Record<ControlSize, string> = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-[15px]',
}

export const controlBase =
  'w-full rounded-lg border border-line bg-raised text-fg placeholder:text-fg-3 outline-none ' +
  'transition-[border-color,box-shadow,background-color] hover:border-line-strong ' +
  'focus:border-brand/70 focus:ring-2 focus:ring-brand/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-invalid:border-red-400/60 aria-invalid:focus:ring-red-400/20'

export function controlStyles(size: ControlSize = 'md', className?: string): string {
  return cn(controlBase, controlSizes[size], className)
}
