import type { ComponentProps, ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Table({ className, children, minWidth }: { className?: string; children: ReactNode; minWidth?: number }) {
  return (
    <div className={cn('relative w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left text-[13px]" style={minWidth ? { minWidth } : undefined}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line text-[11px] font-medium tracking-wide text-fg-3 uppercase">{children}</thead>
  )
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line/70">{children}</tbody>
}

export function TR({ className, children, ...props }: ComponentProps<'tr'>) {
  return (
    <tr className={cn('transition-colors hover:bg-ink/[0.02]', className)} {...props}>
      {children}
    </tr>
  )
}

export function TH({ className, children, align = 'left', ...props }: ComponentProps<'th'> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-2.5 font-medium whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TD({ className, children, align = 'left', ...props }: ComponentProps<'td'> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 align-middle text-fg-2',
        align === 'right' && 'text-right tabular-nums',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  )
}

export type SortDirection = 'asc' | 'desc'

/** Clickable column header that cycles sort direction. */
export function SortableTH({
  label,
  active,
  direction,
  onSort,
  align = 'left',
}: {
  label: string
  active: boolean
  direction: SortDirection
  onSort: () => void
  align?: 'left' | 'right'
}) {
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <TH align={align} aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'inline-flex items-center gap-1 uppercase transition-colors hover:text-fg',
          active && 'text-fg-2',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {label}
        <Icon className="size-3" aria-hidden />
      </button>
    </TH>
  )
}
