import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/utils/cn'

export interface DropdownItem {
  id: string
  label: ReactNode
  description?: ReactNode
  icon?: ReactNode
  onSelect: () => void
  active?: boolean
  danger?: boolean
  disabled?: boolean
}

interface DropdownProps {
  ariaLabel: string
  buttonContent: ReactNode
  buttonClassName?: string
  items: DropdownItem[]
  header?: ReactNode
  footer?: ReactNode
  align?: 'start' | 'end'
  menuClassName?: string
}

/** Accessible menu button with keyboard navigation. */
export function Dropdown({
  ariaLabel,
  buttonContent,
  buttonClassName,
  items,
  header,
  footer,
  align = 'start',
  menuClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useClickOutside([buttonRef, menuRef], () => setOpen(false), open)

  const focusItem = (direction: 1 | -1 | 'first' | 'last') => {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? [])
    if (nodes.length === 0) return
    const current = nodes.indexOf(document.activeElement as HTMLButtonElement)
    let next = 0
    if (direction === 'first') next = 0
    else if (direction === 'last') next = nodes.length - 1
    else next = (current + direction + nodes.length) % nodes.length
    nodes[next].focus()
  }

  const onMenuKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusItem('first')
    } else if (event.key === 'End') {
      event.preventDefault()
      focusItem('last')
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false)
      if (event.key === 'Escape') buttonRef.current?.focus()
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => {
          setOpen((v) => !v)
          window.setTimeout(() => focusItem('first'), 30)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            setOpen(true)
            window.setTimeout(() => focusItem('first'), 30)
          }
        }}
        className={buttonClassName}
      >
        {buttonContent}
      </button>
      {open && (
          <div
            ref={menuRef}
            id={`${id}-menu`}
            role="menu"
            tabIndex={-1}
            aria-label={ariaLabel}
            onKeyDown={onMenuKeyDown}
            className={cn(
              'animate-pop absolute top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-line-strong bg-popover p-1 shadow-2xl shadow-black/30',
              align === 'end' ? 'right-0' : 'left-0',
              menuClassName,
            )}
          >
            {header && <div className="px-2.5 pt-2 pb-1.5">{header}</div>}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                  buttonRef.current?.focus()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors outline-none',
                  'hover:bg-ink/[0.06] focus-visible:bg-ink/[0.08] disabled:opacity-40',
                  item.danger ? 'text-red-300' : 'text-fg',
                )}
              >
                {item.icon}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.label}</span>
                  {item.description && <span className="block truncate text-xs text-fg-3">{item.description}</span>}
                </span>
                {item.active && <Check className="size-4 shrink-0 text-brand" aria-label="Selected" />}
              </button>
            ))}
            {footer && <div className="mt-1 border-t border-line px-1 pt-1">{footer}</div>}
          </div>
        )}
    </div>
  )
}
