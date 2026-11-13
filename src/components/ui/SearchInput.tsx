import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { controlBase } from './form-styles'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  size?: 'sm' | 'md'
}

export function SearchInput({ value, onChange, placeholder = 'Search…', ariaLabel, className, size = 'sm' }: SearchInputProps) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fg-3" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          controlBase,
          size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-sm',
          'pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-1.5 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-fg-3 hover:bg-ink/[0.08] hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
