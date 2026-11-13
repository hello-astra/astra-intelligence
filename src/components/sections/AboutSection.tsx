import { ArrowRight, Compass, Telescope } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { Eyebrow } from '@/components/common/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { ABOUT_COPY, CORE_VALUES, MISSION, VISION } from '@/data/constants/company'
import { paths } from '@/routes/paths'

export function AboutSection() {
  return (
    <section id="about" className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby="about-heading">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0b1430] via-panel to-[#0d0b24] p-6 sm:p-10 lg:p-14">
          <div aria-hidden className="bg-grid mask-fade-b absolute inset-0 opacity-50" />
          <div aria-hidden className="absolute -top-32 -left-24 size-96 rounded-full bg-[radial-gradient(closest-side,rgb(79_134_255/0.22),transparent)]" />
          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_1fr]">
            <Reveal>
              <Eyebrow>About Astra Intelligence</Eyebrow>
              <h2 id="about-heading" className="mt-4 text-3xl leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-fg sm:text-4xl">
                Technology that removes limits — not adds complexity.
              </h2>
              {ABOUT_COPY.map((p) => (
                <p key={p} className="mt-5 text-base leading-relaxed text-fg-2 sm:text-[17px]">
                  {p}
                </p>
              ))}
              <ButtonLink to={paths.about} variant="secondary" className="mt-8" rightIcon={<ArrowRight className="size-4" />}>
                More about us
              </ButtonLink>
            </Reveal>
            <div className="flex flex-col gap-4">
              <Reveal delay={0.05}>
                <div className="rounded-2xl border border-white/[0.08] bg-[#060a16]/70 p-5 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-astra-cyan-soft uppercase">
                    <Compass className="size-4" aria-hidden /> Mission
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-fg">{MISSION}</p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="rounded-2xl border border-white/[0.08] bg-[#060a16]/70 p-5 backdrop-blur">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-astra-violet-soft uppercase">
                    <Telescope className="size-4" aria-hidden /> Vision
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-fg">{VISION}</p>
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <ul className="grid grid-cols-2 gap-2">
                  {CORE_VALUES.map((v) => (
                    <li key={v.title} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <v.icon className="size-4 shrink-0 text-brand-soft" aria-hidden />
                      <span className="text-[13px] font-medium text-fg-2">{v.title}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
