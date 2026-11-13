import { useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, CircleAlert, CircleCheck } from 'lucide-react'
import { INDUSTRIES } from '@/data/constants/industries'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { paths } from '@/routes/paths'
import type { IndustryId } from '@/types/content'
import { cn } from '@/utils/cn'

export function IndustryExplorer({ initial = 'banking' }: { initial?: IndustryId }) {
  const [activeId, setActiveId] = useState<IndustryId>(initial)
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="tablist" aria-label="Industries">
        {INDUSTRIES.map((industry) => {
          const selected = industry.id === activeId
          return (
            <button
              key={industry.id}
              type="button"
              role="tab"
              id={`industry-tab-${industry.id}`}
              aria-selected={selected}
              aria-controls="industry-panel"
              onClick={() => setActiveId(industry.id)}
              className={cn(
                'group relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-xl border p-3.5 text-left transition-all duration-200',
                selected
                  ? 'border-brand/50 bg-gradient-to-br from-brand/15 to-astra-violet/5 shadow-[0_0_0_1px_rgb(79_134_255/0.2)]'
                  : 'border-white/[0.07] bg-panel/60 hover:border-white/[0.15] hover:bg-white/[0.03]',
              )}
            >
              <industry.icon className={cn('size-5 transition-colors', selected ? 'text-brand-soft' : 'text-fg-3 group-hover:text-fg-2')} aria-hidden />
              <span className={cn('mt-4 text-[13px] leading-snug font-medium', selected ? 'text-fg' : 'text-fg-2')}>{industry.name}</span>
            </button>
          )
        })}
      </div>

      <div
        id="industry-panel"
        role="tabpanel"
        aria-labelledby={`industry-tab-${active.id}`}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-panel/80 p-6 sm:p-7"
      >
        <div aria-hidden className="pointer-events-none absolute -right-20 -bottom-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(139_116_255/0.16),transparent)]" />
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="relative"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/25">
                <active.icon className="size-5 text-brand-soft" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-fg">{active.name}</h3>
                <p className="text-[13px] text-fg-3">{active.summary}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Common challenges</h4>
                <ul className="mt-3 space-y-2.5">
                  {active.challenges.map((c) => (
                    <li key={c} className="flex gap-2 text-[13px] leading-relaxed text-fg-2">
                      <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-300/80" aria-hidden />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">How we can help</h4>
                <ul className="mt-3 space-y-2.5">
                  {active.solutions.map((s) => (
                    <li key={s} className="flex gap-2 text-[13px] leading-relaxed text-fg-2">
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-400/90" aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-7 border-t border-white/[0.06] pt-5">
              <h4 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Relevant Astra services</h4>
              <ul className="mt-3 flex flex-wrap gap-2">
                {active.services.map((slug) => {
                  const s = SOLUTION_BY_SLUG[slug]
                  return (
                    <li key={slug}>
                      <Link
                        to={paths.solution(slug)}
                        className="group inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-fg-2 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.08] hover:text-fg"
                      >
                        <s.icon className="size-3.5" style={{ color: s.accent }} aria-hidden />
                        {s.shortName}
                        <ArrowUpRight className="size-3 opacity-50 transition-opacity group-hover:opacity-100" aria-hidden />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
