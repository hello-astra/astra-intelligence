import { ArrowRight, Compass, Telescope } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { PageHero } from '@/components/common/PageHero'
import { Reveal } from '@/components/common/Reveal'
import { Eyebrow } from '@/components/common/SectionHeading'
import { ApproachSection } from '@/components/sections/ApproachSection'
import { CTASection } from '@/components/sections/CTASection'
import { ButtonLink } from '@/components/ui/Button'
import { ABOUT_COPY, CAPABILITY_DOMAINS, CORE_VALUES, MISSION, VISION } from '@/data/constants/company'
import { SITE } from '@/data/constants/site'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export default function AboutPage() {
  useDocumentTitle('About Us', SITE.description)
  return (
    <>
      <PageHero
        eyebrow="About Astra Intelligence"
        title={
          <>
            We engineer technology that <span className="text-gradient-brand">moves businesses beyond limits.</span>
          </>
        }
        description={
          <div className="space-y-4">
            {ABOUT_COPY.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        }
      />

      <section className="py-12" aria-label="Mission and vision">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            <Reveal>
              <div className="relative h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand/[0.12] to-panel p-7 sm:p-9">
                <Compass className="size-7 text-astra-cyan" aria-hidden />
                <h2 className="mt-5 text-xs font-semibold tracking-[0.18em] text-fg-3 uppercase">Our mission</h2>
                <p className="mt-3 text-xl leading-relaxed font-medium text-fg sm:text-2xl">{MISSION}</p>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div className="relative h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-astra-violet/[0.12] to-panel p-7 sm:p-9">
                <Telescope className="size-7 text-astra-violet-soft" aria-hidden />
                <h2 className="mt-5 text-xs font-semibold tracking-[0.18em] text-fg-3 uppercase">Our vision</h2>
                <p className="mt-3 text-xl leading-relaxed font-medium text-fg sm:text-2xl">{VISION}</p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="py-16" aria-labelledby="values-heading">
        <Container>
          <Reveal>
            <Eyebrow>Core values</Eyebrow>
            <h2 id="values-heading" className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              The principles behind every build
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_VALUES.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 0.05}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-panel/70 p-6 transition-colors hover:border-white/[0.14]">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08]">
                    <v.icon className="size-5 text-brand-soft" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-fg">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-3">{v.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16" aria-labelledby="domains-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <Eyebrow>What we do</Eyebrow>
              <h2 id="domains-heading" className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                Four disciplines, one integrated team
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-2">
                Most business problems span more than one discipline. A customer agent needs data; a dashboard needs
                pipelines; automation needs well-engineered software. We bring them together.
              </p>
              <ButtonLink to={paths.solutions} variant="secondary" className="mt-6" rightIcon={<ArrowRight className="size-4" />}>
                Explore our solutions
              </ButtonLink>
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2">
              {CAPABILITY_DOMAINS.map((d, i) => (
                <Reveal key={d.title} delay={i * 0.05}>
                  <div className="h-full rounded-2xl border border-white/[0.07] bg-panel/70 p-5">
                    <span className="font-mono text-xs text-fg-4">0{i + 1}</span>
                    <h3 className="mt-2 text-[15px] font-semibold text-fg">{d.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-3">{d.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <ApproachSection id="approach" />

      <CTASection />
    </>
  )
}
