import { Link } from 'react-router'
import { ArrowUpRight, MousePointerClick } from 'lucide-react'
import type { Solution } from '@/types/content'
import { paths } from '@/routes/paths'
import { cn } from '@/utils/cn'
import { SolutionPreview } from './previews/SolutionPreview'
import { accentVars } from '@/theme/accents'

interface DemoTileProps {
  solution: Solution
  className?: string
  /** Show the "try this" interaction list. */
  detailed?: boolean
  previewHeight?: number
}

export function DemoTile({ solution, className, detailed, previewHeight = 230 }: DemoTileProps) {
  return (
    <Link
      to={paths.demo(solution.slug)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-ink/[0.08] bg-panel/80 p-3 transition-[border-color,transform,box-shadow] duration-300',
        'hover:-translate-y-0.5 hover:border-ink/[0.16] hover:shadow-[0_24px_60px_-30px_color-mix(in_oklab,var(--color-brand)_45%,transparent)]',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(closest-side, ${solution.accent}30, transparent)` }}
      />
      <div style={{ height: previewHeight }}>
        <SolutionPreview demoId={solution.demoId} />
      </div>
      <div className="relative flex flex-1 flex-col px-2 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-fg-4">
              {solution.number} · {solution.demo.category}
            </p>
            <h3 className="mt-1 text-base font-semibold text-fg">{solution.demo.productName}</h3>
            <p className="text-[13px] text-fg-3">{solution.name}</p>
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] ring-1 ring-ink/10 transition-colors group-hover:bg-brand-strong group-hover:ring-brand">
            <ArrowUpRight className="size-4 text-fg-2 transition-colors group-hover:text-on-brand" aria-hidden />
          </span>
        </div>
        {detailed && (
          <ul className="mt-4 space-y-1.5 border-t border-ink/[0.06] pt-4">
            {solution.demo.tryThis.slice(0, 3).map((t) => (
              <li key={t} className="flex gap-2 text-[13px] text-fg-2">
                <MousePointerClick className="text-sol-accent mt-0.5 size-3.5 shrink-0" style={accentVars(solution)} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto pt-4 text-[13px] font-medium text-brand-soft">
          Launch demo <span className="sr-only">: {solution.demo.productName}</span>
          <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  )
}
