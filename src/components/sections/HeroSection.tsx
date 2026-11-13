import { ArrowRight, Check, FlaskConical } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { ButtonLink } from '@/components/ui/Button'
import { SITE } from '@/data/constants/site'
import { paths } from '@/routes/paths'
import { HeroVisual } from './HeroVisual'

const POINTS = ['Custom-built, not templated', 'Scalable cloud architecture', 'Security by design']

/**
 * Above-the-fold hero. It is pre-rendered into index.html at build time and is fully
 * visible on the first frame: no entrance animation hides it while scripts load.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <Container className="grid items-center gap-12 pt-10 pb-16 sm:pt-14 lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:pt-20 lg:pb-24">
        <div className="relative z-10 max-w-2xl">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/[0.04] py-1 pr-3 pl-1.5 text-xs text-fg-2">
              <span className="rounded-full bg-gradient-to-r from-[#3f7bff] to-[#7c5cff] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                Astra
              </span>
              {SITE.tagline}
            </span>
          </div>

          <h1
            id="hero-title"
            className="mt-6 text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-fg sm:text-6xl lg:text-[4.1rem]"
          >
            Engineering Intelligence. <span className="text-gradient-brand">Transforming Possibilities.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-fg-2">
            From intelligent automation to enterprise-grade software, we engineer technology that helps businesses operate
            smarter, scale faster and move beyond limitations.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={paths.solutions} size="lg" rightIcon={<ArrowRight className="size-4" />}>
              Explore Our Solutions
            </ButtonLink>
            <ButtonLink to={paths.lab} size="lg" variant="glass" leftIcon={<FlaskConical className="size-4 text-astra-cyan" />}>
              Experience Live Demos
            </ButtonLink>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-fg-3">
                <span className="flex size-4 items-center justify-center rounded-full bg-brand/15 ring-1 ring-brand/30">
                  <Check className="size-2.5 text-brand-soft" strokeWidth={3} aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative px-2 sm:px-6 lg:px-0">
          <HeroVisual />
        </div>
      </Container>
    </section>
  )
}
