import { ArrowUpRight, CheckCircle2, FlaskConical, MessageSquare } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { PageHero } from '@/components/common/PageHero'
import { Reveal } from '@/components/common/Reveal'
import { TechChip } from '@/components/common/TechChip'
import { CTASection } from '@/components/sections/CTASection'
import { SolutionPreview } from '@/components/sections/previews/SolutionPreview'
import { ButtonLink } from '@/components/ui/Button'
import { INDUSTRY_BY_ID } from '@/data/constants/industries'
import { SOLUTIONS } from '@/data/constants/solutions'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { contactPath, paths } from '@/routes/paths'
import type { Solution } from '@/types/content'
import { cn } from '@/utils/cn'
import { accentVars } from '@/theme/accents'

export default function SolutionsPage() {
  useDocumentTitle('Solutions', 'Nine solution areas from Astra Intelligence: SaaS, commerce, dashboards, AI agents, predictive analytics, workspaces, FinTech, ERP and document intelligence.')
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title={
          <>
            Nine ways we turn technology into <span className="text-gradient-brand">business results.</span>
          </>
        }
        description="Every solution below is engineered around your processes and data — and each one has a working demonstration in our Interactive Lab."
      >
        <nav aria-label="Jump to a solution">
          <ul className="flex flex-wrap gap-2">
            {SOLUTIONS.map((s) => (
              <li key={s.slug}>
                <a
                  href={`#${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-3 py-1.5 text-xs text-fg-2 ring-1 ring-ink/[0.08] transition-colors hover:bg-ink/[0.08] hover:text-fg"
                >
                  <s.icon className="text-sol-accent size-3.5" style={accentVars(s)} aria-hidden />
                  {s.shortName}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <div className="space-y-6 pb-8 sm:space-y-8">
        {SOLUTIONS.map((s, i) => (
          <SolutionFeature key={s.slug} solution={s} reverse={i % 2 === 1} />
        ))}
      </div>

      <CTASection />
    </>
  )
}

function SolutionFeature({ solution: s, reverse }: { solution: Solution; reverse: boolean }) {
  return (
    <section id={s.slug} className="scroll-mt-24" aria-labelledby={`${s.slug}-title`}>
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-ink/[0.08] bg-panel/70">
            <div
              aria-hidden
              className={cn('pointer-events-none absolute -top-40 size-[28rem] rounded-full', reverse ? '-left-40' : '-right-40')}
              style={{ background: `radial-gradient(closest-side, ${s.accent}24, transparent)` }}
            />
            <div className={cn('relative grid gap-8 p-5 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10', reverse && 'lg:[&>*:first-child]:order-2')}>
              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-11 items-center justify-center rounded-xl ring-1 ring-ink/10"
                    style={{ background: `linear-gradient(135deg, ${s.accent}38, ${s.accent}0d)` }}
                  >
                    <s.icon className="text-sol-accent size-5" style={accentVars(s)} aria-hidden />
                  </span>
                  <span className="font-mono text-xs text-fg-4">{s.number} / 09</span>
                </div>
                <h2 id={`${s.slug}-title`} className="mt-5 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                  {s.name}
                </h2>
                <p className="text-sol mt-2 text-[15px] font-medium" style={accentVars(s)}>
                  {s.tagline}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{s.description}</p>

                <div className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {s.capabilities.map((c) => (
                    <div key={c.title} className="flex gap-2.5">
                      <c.icon className="mt-0.5 size-4 shrink-0 text-fg-3" aria-hidden />
                      <div>
                        <p className="text-[13px] font-medium text-fg">{c.title}</p>
                        <p className="text-xs leading-relaxed text-fg-3">{c.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-2.5">
                  <ButtonLink to={paths.demo(s.slug)} leftIcon={<FlaskConical className="size-4" />}>
                    Explore Interactive Demo
                  </ButtonLink>
                  <ButtonLink to={paths.solution(s.slug)} variant="secondary" rightIcon={<ArrowUpRight className="size-4" />}>
                    Full details
                  </ButtonLink>
                  <ButtonLink to={contactPath({ service: s.slug })} variant="ghost" leftIcon={<MessageSquare className="size-4" />}>
                    Discuss
                  </ButtonLink>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-6">
                <div className="h-[260px]">
                  <SolutionPreview demoId={s.demoId} />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Business problems solved</h3>
                    <ul className="mt-3 space-y-2">
                      {s.problemsSolved.map((p) => (
                        <li key={p} className="flex gap-2 text-[13px] text-fg-2">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400/90" aria-hidden />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Industry use cases</h3>
                    <ul className="mt-3 space-y-2.5">
                      {s.useCases.map((u) => (
                        <li key={u.title} className="text-[13px]">
                          <span className="font-medium text-fg">{u.title}</span>
                          <span className="block text-xs text-fg-3">{INDUSTRY_BY_ID[u.industry].name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Technologies involved</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.technologies.map((t) => (
                      <TechChip key={t} id={t} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
