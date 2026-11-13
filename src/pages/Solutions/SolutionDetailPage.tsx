import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, ChevronRight, CircleCheck, FlaskConical, Maximize2, MessageSquare, Target } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { Eyebrow } from '@/components/common/SectionHeading'
import { TechLogo } from '@/components/common/TechLogo'
import { CTASection } from '@/components/sections/CTASection'
import { SolutionPreview } from '@/components/sections/previews/SolutionPreview'
import { ButtonAnchor, ButtonLink } from '@/components/ui/Button'
import { INDUSTRY_BY_ID } from '@/data/constants/industries'
import { SOLUTIONS, getSolution } from '@/data/constants/solutions'
import { TECH_BY_ID } from '@/data/constants/techStack'
import { DemoHost } from '@/demos/DemoHost'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import NotFoundPage from '@/pages/NotFound/NotFoundPage'
import { contactPath, paths } from '@/routes/paths'

export default function SolutionDetailPage() {
  const { slug } = useParams()
  const solution = getSolution(slug)
  useDocumentTitle(solution?.name, solution?.description)

  if (!solution) return <NotFoundPage />

  const index = SOLUTIONS.indexOf(solution)
  const prev = SOLUTIONS[(index - 1 + SOLUTIONS.length) % SOLUTIONS.length]
  const next = SOLUTIONS[(index + 1) % SOLUTIONS.length]
  const s = solution

  return (
    <>
      {/* Hero */}
      <section className="relative pt-8 pb-14 sm:pt-12 lg:pb-20">
        <div aria-hidden className="pointer-events-none absolute top-0 right-0 h-[560px] w-[720px] rounded-full" style={{ background: `radial-gradient(closest-side, ${s.accent}1f, transparent)` }} />
        <Container>
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-xs text-fg-3">
            <Link to={paths.solutions} className="hover:text-fg">
              Solutions
            </Link>
            <ChevronRight className="size-3" aria-hidden />
            <span className="text-fg-2" aria-current="page">
              {s.shortName}
            </span>
          </nav>
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl ring-1 ring-white/10" style={{ background: `linear-gradient(135deg, ${s.accent}40, ${s.accent}0f)` }}>
                  <s.icon className="size-6" style={{ color: s.accent }} aria-hidden />
                </span>
                <Eyebrow>Solution {s.number}</Eyebrow>
              </div>
              <h1 className="mt-6 text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-balance text-fg sm:text-5xl">{s.name}</h1>
              <p className="mt-3 text-lg font-medium" style={{ color: s.accent }}>
                {s.tagline}
              </p>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-2">{s.description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonAnchor href="#demo" size="lg" leftIcon={<FlaskConical className="size-4" />}>
                  Try the live demo
                </ButtonAnchor>
                <ButtonLink to={contactPath({ service: s.slug })} size="lg" variant="glass" leftIcon={<MessageSquare className="size-4" />}>
                  Discuss a similar solution
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="h-[300px] sm:h-[320px]">
              <SolutionPreview demoId={s.demoId} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* What & why */}
      <section className="py-14 sm:py-20" aria-labelledby="what-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <Eyebrow>What it is</Eyebrow>
              <h2 id="what-heading" className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                {s.shortName}, explained
              </h2>
              <p className="mt-4 text-base leading-relaxed text-fg-2 sm:text-[17px]">{s.whatItIs}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <Eyebrow>Why businesses need it</Eyebrow>
              <ul className="mt-5 space-y-3">
                {s.whyItMatters.map((w) => (
                  <li key={w} className="flex gap-3 rounded-xl border border-white/[0.06] bg-panel/60 p-4 text-[15px] leading-relaxed text-fg-2">
                    <Target className="mt-1 size-4 shrink-0" style={{ color: s.accent }} aria-hidden />
                    {w}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Key features */}
      <section className="py-14 sm:py-20" aria-labelledby="features-heading">
        <Container>
          <Reveal>
            <Eyebrow>Key features</Eyebrow>
            <h2 id="features-heading" className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              What the platform does
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
            {s.capabilities.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 0.05} className="bg-[#070b16]">
                <div className="h-full p-6">
                  <c.icon className="size-5" style={{ color: s.accent }} aria-hidden />
                  <h3 className="mt-4 text-[15px] font-semibold text-fg">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-3">{c.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Interactive demo */}
      <section id="demo" className="scroll-mt-20 py-14 sm:py-20" aria-labelledby="demo-heading">
        <Container size="wide">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Interactive product demonstration</Eyebrow>
              <h2 id="demo-heading" className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                Try {s.demo.productName}
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] text-fg-2">{s.demo.summary}</p>
            </div>
            <ButtonLink to={paths.demo(s.slug)} variant="secondary" size="sm" leftIcon={<Maximize2 className="size-3.5" />} className="self-start sm:self-auto">
              Open full screen
            </ButtonLink>
          </div>
          <DemoHost demoId={s.demoId} variant="embedded" />
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-3">
            {s.demo.tryThis.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-brand" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Applications */}
      <section className="py-14 sm:py-20" aria-labelledby="applications-heading">
        <Container>
          <Reveal>
            <Eyebrow>Real-world applications</Eyebrow>
            <h2 id="applications-heading" className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              Where it makes a difference
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.useCases.map((u, i) => {
              const industry = INDUSTRY_BY_ID[u.industry]
              return (
                <Reveal key={u.title} delay={i * 0.05}>
                  <div className="h-full rounded-2xl border border-white/[0.07] bg-panel/70 p-5">
                    <industry.icon className="size-5 text-fg-3" aria-hidden />
                    <p className="mt-4 text-xs text-fg-3">{industry.name}</p>
                    <h3 className="mt-1 text-[15px] font-semibold text-fg">{u.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-3">{u.description}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Deliverables */}
      <section className="py-14 sm:py-20" aria-labelledby="deliver-heading">
        <Container>
          <div className="grid gap-10 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-panel to-[#0a0d22] p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <Reveal>
              <Eyebrow>What Astra Intelligence can deliver</Eyebrow>
              <h2 id="deliver-heading" className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                A production-ready solution, end to end
              </h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex gap-2.5 text-sm leading-relaxed text-fg-2">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-400/90" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.05}>
              <h3 className="text-xs font-semibold tracking-wide text-fg-3 uppercase">Technologies typically involved</h3>
              <ul className="mt-4 grid grid-cols-2 gap-2">
                {s.technologies.map((t) => (
                  <li key={t} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <TechLogo id={t} size={16} />
                    <span className="text-[13px] text-fg-2">{TECH_BY_ID[t].name}</span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 text-xs font-semibold tracking-wide text-fg-3 uppercase">Business problems solved</h3>
              <ul className="mt-3 space-y-2">
                {s.problemsSolved.map((p) => (
                  <li key={p} className="flex gap-2 text-[13px] text-fg-2">
                    <Target className="mt-0.5 size-3.5 shrink-0 text-astra-violet" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </section>

      <CTASection
        title={`Want a solution like ${s.demo.productName}, built around your business?`}
        description="We tailor every build to your workflows, data and systems. Let’s discuss what a version for your business would look like."
        service={s.slug}
      />

      <Container>
        <nav aria-label="More solutions" className="grid gap-3 border-t border-white/[0.06] pt-8 sm:grid-cols-2">
          <Link to={paths.solution(prev.slug)} className="group rounded-xl border border-white/[0.07] p-4 transition-colors hover:border-white/[0.15]">
            <span className="flex items-center gap-1.5 text-xs text-fg-3">
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" /> Previous solution
            </span>
            <span className="mt-1 block text-sm font-medium text-fg">{prev.name}</span>
          </Link>
          <Link to={paths.solution(next.slug)} className="group rounded-xl border border-white/[0.07] p-4 text-right transition-colors hover:border-white/[0.15]">
            <span className="flex items-center justify-end gap-1.5 text-xs text-fg-3">
              Next solution <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="mt-1 block text-sm font-medium text-fg">{next.name}</span>
          </Link>
        </nav>
      </Container>
    </>
  )
}
