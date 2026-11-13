import { Moon, Sun } from 'lucide-react'
import { useColorMode } from '@/theme/color-mode'
import { cn } from '@/utils/cn'

/**
 * Light/dark switch. Both icons are rendered and CSS shows the right one, so the
 * button is correct even in the pre-rendered HTML before React has mounted.
 */
export function ThemeToggle({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  const { mode, toggle } = useColorMode()
  const label = mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg text-fg-2 ring-1 ring-ink/10 transition-colors ring-inset hover:bg-ink/[0.06] hover:text-fg',
        size === 'sm' ? 'size-8' : 'size-9',
        className,
      )}
    >
      <Sun className="size-4 light:hidden" aria-hidden />
      <Moon className="hidden size-4 light:block" aria-hidden />
    </button>
  )
}
