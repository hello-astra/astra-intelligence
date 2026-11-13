import { TECH_BY_ID } from '@/data/constants/techStack'
import type { TechId } from '@/types/content'
import { cn } from '@/utils/cn'
import { TechLogo } from './TechLogo'

export function TechChip({ id, className }: { id: TechId; className?: string }) {
  const tech = TECH_BY_ID[id]
  return (
    <span
      title={tech.description}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1 text-xs text-fg-2 ring-1 ring-white/[0.07] ring-inset',
        className,
      )}
    >
      <TechLogo id={id} size={13} />
      {tech.name}
    </span>
  )
}
