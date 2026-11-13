import { BrainCircuit, ChartNoAxesCombined, Code2, Workflow } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { CAPABILITY_DOMAINS } from '@/data/constants/company'
import { cn } from '@/utils/cn'

const ICONS = [BrainCircuit, Code2, Workflow, ChartNoAxesCombined]
const ICON_TONES = ['text-astra-violet-soft', 'text-brand-soft', 'text-astra-cyan', 'text-astra-violet']

export function CapabilityStrip() {
  return (
    <section aria-label="What we engineer" className="relative">
      <Container>
        <Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-ink/[0.07] bg-ink/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITY_DOMAINS.map((d, i) => {
              const Icon = ICONS[i]
              return (
                <div key={d.title} className="relative bg-base p-5 sm:p-6">
                  <Icon className={cn('size-5', ICON_TONES[i])} aria-hidden />
                  <h2 className="mt-3 text-sm font-semibold text-fg">{d.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg-3">{d.description}</p>
                </div>
              )
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
