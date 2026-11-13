import { useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, ArrowUpRight, CheckCircle2, FlaskConical, Target } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { SectionHeading } from '@/components/common/SectionHeading'
import { TechChip } from '@/components/common/TechChip'
import { ButtonLink } from '@/components/ui/Button'
import { INDUSTRY_BY_ID } from '@/data/constants/industries'
import { SOLUTIONS } from '@/data/constants/solutions'
import { paths } from '@/routes/paths'
import { prefetchPath } from '@/routes/route-modules'
import { accentVars } from '@/theme/accents'
import { cn } from '@/utils/cn'
import { SolutionPreview } from './previews/SolutionPreview'

export function SolutionsExplorer() {
  const [index, setIndex] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const active = SOLUTIONS[index]

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    if (event.key in keys) {
      event.preventDefault()
      const next = (index + keys[event.key] + SOLUTIONS.length) % SOLUTIONS.length
      setIndex(next)
      tabRefs.current[next]?.focus()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : SOLUTIONS.length - 1
      setIndex(next)
      tabRefs.current[next]?.focus()
    }
  }

  return (
    <section id="solutions" className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby="solutions-heading">
      <Container>
        <SectionHeading
          eyebrow="Solutions"
          title={<span id="solutions-heading">Nine solution areas. One engineering partner.</span>}
          description="Choose a solution to see what it does, the problems it solves and the technology behind it — then try a working version in the Lab."
          actions={
            <ButtonLink to={paths.solutions} variant="secondary" rightIcon={<ArrowRight className="size-4" />}>
              All solutions
            </ButtonLink>
          }
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-8">
          {/* Selector */}
          <div
            role="tablist"
            aria-label="Solutions"
            aria-orientation="vertical"
            className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {SOLUTIONS.map((s, i) => {
              const selected = i === index
              return (
                <button
                  key={s.slug}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`solution-tab-${s.slug}`}
                  aria-selected={selected}
                  aria-controls="solution-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setIndex(i)}
                  onKeyDown={onKeyDown}
                  className={cn(
                    'group relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors lg:py-3',
                    selected ? 'text-fg' : 'text-fg-3 hover:bg-ink/[0.03] hover:text-fg-2',
                  )}
                >
                  {selected && <span className="absolute inset-0 rounded-xl border border-ink/[0.09] bg-ink/[0.045]" />}
                  <span className="relative hidden w-6 font-mono text-[11px] text-fg-4 lg:block">{s.number}</span>
                  <span
                    className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-ink/10 transition-colors', !selected && 'bg-ink/[0.03]')}
                    style={selected ? { ...accentVars(s), background: `${s.accent}26` } : undefined}
                  >
                    <s.icon className={cn('size-4', selected && 'text-sol-accent')} aria-hidden />
                  </span>
                  <span className="relative text-sm font-medium whitespace-nowrap lg:whitespace-normal">{s.shortName}</span>
                  {selected && <ArrowRight className="relative ml-auto hidden size-4 text-fg-3 lg:block" aria-hidden />}
                </button>
              )
            })}
          </div>

          {/* Detail panel */}
          <div
            role="tabpanel"
            id="solution-panel"
            aria-labelledby={`solution-tab-${active.slug}`}
            className="relative min-h-[560px] overflow-hidden rounded-2xl border border-ink/[0.08] bg-panel/80"
            style={accentVars(active)}
          >
            {/* A radial gradient is already soft — no blur filter needed (blur forces an expensive offscreen pass). */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-48 -right-48 size-[28rem] rounded-full opacity-70"
              style={{ background: `radial-gradient(closest-side, ${active.accent}2e, transparent)` }}
            />
            <div key={active.slug} className="animate-enter relative grid gap-8 p-5 sm:p-7 xl:grid-cols-[1.05fr_1fr]">
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-fg-4">{active.number} / 09</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-ink/10 to-transparent" />
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-fg">{active.name}</h3>
                  <p className="text-sol mt-1 text-sm font-medium">
                    {active.tagline}
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{active.description}</p>

                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Key capabilities</h4>
                      <ul className="mt-3 space-y-2">
                        {active.capabilities.map((c) => (
                          <li key={c.title} className="flex gap-2 text-[13px] text-fg-2">
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                            {c.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Problems it solves</h4>
                      <ul className="mt-3 space-y-2">
                        {active.problemsSolved.map((p) => (
                          <li key={p} className="flex gap-2 text-[13px] text-fg-2">
                            <Target className="mt-0.5 size-3.5 shrink-0 text-astra-violet" aria-hidden />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2.5 pt-8">
                    <ButtonLink
                      to={paths.demo(active.slug)}
                      leftIcon={<FlaskConical className="size-4" />}
                      onMouseEnter={() => prefetchPath(paths.demo(active.slug))}
                      onFocus={() => prefetchPath(paths.demo(active.slug))}
                    >
                      Explore Interactive Demo
                    </ButtonLink>
                    <ButtonLink to={paths.solution(active.slug)} variant="secondary" rightIcon={<ArrowUpRight className="size-4" />}>
                      Solution details
                    </ButtonLink>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-5">
                  <div className="h-[250px]">
                    <SolutionPreview demoId={active.demoId} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Technologies involved</h4>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {active.technologies.map((t) => (
                        <TechChip key={t} id={t} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Industry use cases</h4>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {active.useCases.map((u) => (
                        <li key={u.title} className="rounded-lg border border-ink/[0.06] bg-ink/[0.02] p-3">
                          <p className="text-[11px] text-fg-3">{INDUSTRY_BY_ID[u.industry].name}</p>
                          <p className="mt-0.5 text-[13px] font-medium text-fg">{u.title}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
