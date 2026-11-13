import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { Eyebrow } from '@/components/common/SectionHeading'
import { APPROACH_STEPS, DELIVERY_PILLARS } from '@/data/constants/approach'

export function ApproachSection({ id = 'approach' }: { id?: string }) {
  return (
    <section id={id} className="relative scroll-mt-20 py-20 sm:py-28" aria-labelledby={`${id}-heading`}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <Eyebrow>Our development approach</Eyebrow>
              <h2 id={`${id}-heading`} className="mt-4 text-3xl leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-fg sm:text-4xl lg:text-[44px]">
                From first conversation to continuous improvement.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-fg-2 sm:text-lg">
                A transparent, seven-stage process that keeps you close to the work — with working software early and
                often, and support long after launch.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {DELIVERY_PILLARS.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.05}>
                  <div className="h-full rounded-xl border border-white/[0.07] bg-panel/70 p-4">
                    <p.icon className="size-5 text-astra-cyan" aria-hidden />
                    <p className="mt-3 text-sm font-semibold text-fg">{p.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-fg-3">{p.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <ol className="relative">
            <span aria-hidden className="absolute top-3 bottom-3 left-[21px] w-px bg-gradient-to-b from-brand/60 via-astra-violet/40 to-astra-cyan/30" />
            {APPROACH_STEPS.map((step, i) => (
              <li key={step.number} className="relative pb-8 pl-16 last:pb-0">
                <Reveal delay={0.04 * i}>
                  <span className="absolute top-0 left-0 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-[#0b1226] shadow-[0_0_0_4px_#05070e]">
                    <step.icon className="size-5 text-brand-soft" aria-hidden />
                  </span>
                  <div className="rounded-xl border border-white/[0.07] bg-panel/60 p-5 transition-colors hover:border-white/[0.13]">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-fg-4">{step.number}</span>
                      <h3 className="text-base font-semibold text-fg">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-fg-2">{step.description}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Key outputs">
                      {step.outputs.map((o) => (
                        <li key={o} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-fg-3 ring-1 ring-white/[0.06]">
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
