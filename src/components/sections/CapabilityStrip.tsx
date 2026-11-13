import { BrainCircuit, ChartNoAxesCombined, Code2, Workflow } from 'lucide-react'
import { Container } from '@/components/common/Container'
import { Reveal } from '@/components/common/Reveal'
import { CAPABILITY_DOMAINS } from '@/data/constants/company'

const ICONS = [BrainCircuit, Code2, Workflow, ChartNoAxesCombined]
const COLORS = ['#a78bfa', '#4f86ff', '#22d3ee', '#818cf8']

export function CapabilityStrip() {
  return (
    <section aria-label="What we engineer" className="relative">
      <Container>
        <Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITY_DOMAINS.map((d, i) => {
              const Icon = ICONS[i]
              return (
                <div key={d.title} className="relative bg-[#070b16] p-5 sm:p-6">
                  <Icon className="size-5" style={{ color: COLORS[i] }} aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold text-fg">{d.title}</h3>
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
