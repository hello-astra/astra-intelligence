import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'
import { hashString } from '@/utils/random'

// Mid-dark tints so white initials stay legible (>= 4.5:1).
const AVATAR_COLORS = ['#2f66e8', '#6a4fe0', '#0e7490', '#b4541f', '#b23a68', '#17845a', '#8a6a12', '#4b57d6', '#9d3fb5']

interface AvatarProps {
  name: string
  size?: number
  className?: string
  /** Adds a ring in the surface color so overlapping avatars stay distinct. */
  ring?: boolean
  title?: string
}

export function Avatar({ name, size = 28, className, ring, title }: AvatarProps) {
  const color = AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length]
  return (
    <span
      title={title ?? name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none',
        ring && 'ring-2 ring-panel',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.38)), backgroundColor: color }}
      aria-hidden={title === '' ? true : undefined}
    >
      {initials(name)}
    </span>
  )
}

export function AvatarGroup({ names, max = 4, size = 24 }: { names: string[]; max?: number; size?: number }) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length
  return (
    <span className="flex items-center -space-x-1.5" aria-label={names.join(', ')}>
      {shown.map((n) => (
        <Avatar key={n} name={n} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-raised text-[10px] font-medium text-fg-2 ring-2 ring-panel"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}
