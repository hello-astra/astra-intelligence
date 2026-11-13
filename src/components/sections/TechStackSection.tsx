import { Info } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'
import { TechLogo } from '@/components/common/TechLogo'
import { TECH_CATEGORIES, TECH_STACK } from '@/data/constants/techStack'
import { cn } from '@/utils/cn'

const LAYOUT: Record<string, string> = {
  frontend: 'lg:col-span-3',
  backend: 'lg:col-span-3',
  database: 'lg:col-span-2',
  'ai-data': 'lg:col-span-4',
  infrastructure: 'lg:col-span-6',
}

const GRID_COLS: Record<string, string> = {
  database: 'grid-cols-2',
  infrastructure: 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8',
}

export function TechStackSection() {
  return (
    <section id="technology" className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby="technology-heading">
      <Container>
        <SectionHeading
          eyebrow="Technology ecosystem"
          title={<span id="technology-heading">Modern, proven technology — chosen per project.</span>}
          description="These are the technologies our teams work with. We select the right combination for each project’s requirements, scale and existing systems — no solution uses the entire stack."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          {TECH_CATEGORIES.map((cat, ci) => {
            const items = TECH_STACK.filter((t) => t.category === cat.id)
            return (
              <Reveal key={cat.id} delay={ci * 0.05} className={cn('flex', LAYOUT[cat.id])}>
                <div className="w-full rounded-2xl border border-ink/[0.07] bg-panel/70 p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-fg">{cat.label}</h3>
                    <p className="text-xs text-fg-3">{cat.description}</p>
                  </div>
                  <ul className={cn('mt-4 grid gap-2', GRID_COLS[cat.id] ?? 'grid-cols-2 sm:grid-cols-3')}>
                    {items.map((t) => (
                      <li
                        key={t.id}
                        title={t.description}
                        className="group flex flex-col items-start gap-3 rounded-xl border border-ink/[0.05] bg-ink/[0.02] p-3 transition-colors hover:border-ink/[0.12] hover:bg-ink/[0.04]"
                      >
                        <span className="flex size-9 items-center justify-center rounded-lg bg-ink/[0.04] ring-1 ring-ink/[0.06]">
                          <TechLogo id={t.id} size={18} />
                        </span>
                        <span>
                          <span className="block text-[13px] font-medium text-fg">{t.name}</span>
                          <span className="block text-[11px] leading-snug text-fg-3">{t.description}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </div>
        <p className="mt-6 flex items-start gap-2 text-xs text-fg-3">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          Trademarks and logos belong to their respective owners and indicate technologies we work with, not partnerships or endorsements.
        </p>
      </Container>
    </section>
  )
}
