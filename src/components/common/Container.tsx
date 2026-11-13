import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Container({ className, children, size = 'default' }: { className?: string; children: ReactNode; size?: 'default' | 'wide' | 'narrow' }) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        size === 'default' && 'max-w-7xl',
        size === 'wide' && 'max-w-[1440px]',
        size === 'narrow' && 'max-w-4xl',
        className,
      )}
    >
      {children}
    </div>
  )
}
